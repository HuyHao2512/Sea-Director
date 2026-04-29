import React, { useState, useEffect } from 'react';
import { Users, Sparkles, RefreshCw, Loader2, MapPin, Archive, X, Search, Trash2, Package, Link2 } from 'lucide-react';
import { ProjectState, CharacterVariation, Character, Scene, Prop, AspectRatio, AssetLibraryItem, CharacterTurnaroundPanel } from '../../types';
import { generateImage, generateVisualPrompts, generateCharacterTurnaroundPanels, generateCharacterTurnaroundImage } from '../../services/aiService';
import { 
  getRegionalPrefix, 
  handleImageUpload, 
  getProjectLanguage, 
  getProjectVisualStyle,
  delay,
  generateId,
  compareIds 
} from './utils';
import { DEFAULTS, STYLES, GRID_LAYOUTS } from './constants';
import ImagePreviewModal from './ImagePreviewModal';
import CharacterCard from './CharacterCard';
import SceneCard from './SceneCard';
import PropCard from './PropCard';
import WardrobeModal from './WardrobeModal';
import TurnaroundModal from './TurnaroundModal';
import { useAlert } from '../GlobalAlert';
import { getAllAssetLibraryItems, saveAssetToLibrary, deleteAssetFromLibrary } from '../../services/storageService';
import { applyLibraryItemToProject, createLibraryItemFromCharacter, createLibraryItemFromScene, createLibraryItemFromProp, cloneCharacterForProject } from '../../services/assetLibraryService';
import { AspectRatioSelector } from '../AspectRatioSelector';
import { getUserAspectRatio, setUserAspectRatio, getActiveImageModel } from '../../services/modelRegistry';
import { updatePromptWithVersion } from '../../services/promptVersionService';
import CharacterLibraryPickerModal from './CharacterLibraryPicker';
import ProjectAssetPicker from './ProjectAssetPicker';
import { loadSeriesProject } from '../../services/storageService';
import { SeriesProject } from '../../types';

interface Props {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState> | ((prev: ProjectState) => ProjectState)) => void;
  onApiKeyError?: (error: any) => boolean;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

const StageAssets: React.FC<Props> = ({ project, updateProject, onApiKeyError, onGeneratingChange }) => {
  const { showAlert } = useAlert();
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryItems, setLibraryItems] = useState<AssetLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'character' | 'scene' | 'prop'>('all');
  const [libraryProjectFilter, setLibraryProjectFilter] = useState('all');
  const [replaceTargetCharId, setReplaceTargetCharId] = useState<string | null>(null);
  const [turnaroundCharId, setTurnaroundCharId] = useState<string | null>(null);
  const [showCharLibraryPicker, setShowCharLibraryPicker] = useState(false);
  const [showSceneLibraryPicker, setShowSceneLibraryPicker] = useState(false);
  const [showPropLibraryPicker, setShowPropLibraryPicker] = useState(false);
  const [pickerProject, setPickerProject] = useState<SeriesProject | null>(null);

  const loadPickerProject = async (): Promise<SeriesProject | null> => {
    if (!project.projectId) return null;
    try {
      const sp = await loadSeriesProject(project.projectId);
      setPickerProject(sp);
      return sp;
    } catch { return null; }
  };

  const upsertEpisodeRef = <TRef,>(
    refs: TRef[] | undefined,
    key: string,
    getKey: (ref: TRef) => string,
    nextRef: TRef
  ): TRef[] => {
    const currentRefs = refs || [];
    const hasRef = currentRefs.some(ref => getKey(ref) === key);
    if (!hasRef) return [...currentRefs, nextRef];
    return currentRefs.map(ref => (getKey(ref) === key ? nextRef : ref));
  };

  const upsertCharacterRef = (characterId: string, syncedVersion: number) =>
    upsertEpisodeRef(
      project.characterRefs,
      characterId,
      ref => ref.characterId,
      { characterId, syncedVersion, syncStatus: 'synced' as const }
    );

  const upsertSceneRef = (sceneId: string, syncedVersion: number) =>
    upsertEpisodeRef(
      project.sceneRefs,
      sceneId,
      ref => ref.sceneId,
      { sceneId, syncedVersion, syncStatus: 'synced' as const }
    );

  const upsertPropRef = (propId: string, syncedVersion: number) =>
    upsertEpisodeRef(
      project.propRefs,
      propId,
      ref => ref.propId,
      { propId, syncedVersion, syncStatus: 'synced' as const }
    );

  const appendLinkedLibraryAsset = <
    TAsset extends { id: string; version?: number },
    TField extends 'characters' | 'scenes' | 'props',
    TRefField extends 'characterRefs' | 'sceneRefs' | 'propRefs'
  >(params: {
    asset: TAsset;
    idPrefix: 'char' | 'scene' | 'prop';
    field: TField;
    refField: TRefField;
    upsertRef: (assetId: string, syncedVersion: number) => ProjectState[TRefField];
    onDone: () => void;
  }) => {
    if (!project.scriptData) return;

    const { asset, idPrefix, field, refField, upsertRef, onDone } = params;
    const linkedAsset = {
      ...asset,
      id: generateId(idPrefix),
      libraryId: asset.id,
      libraryVersion: asset.version || 1,
    };
    const nextRefs = upsertRef(asset.id, asset.version || 1);

    updateProject(prev => {
      const currentScriptData = prev.scriptData!;
      const currentItems = ((currentScriptData as any)[field] || []) as any[];
      return {
        ...prev,
        scriptData: invalidateShotGenerationMeta({
          ...currentScriptData,
          [field]: [...currentItems, linkedAsset],
        }),
        [refField]: nextRefs,
      };
    });

    onDone();
  };

  const cloneScriptData = <T extends ProjectState['scriptData']>(scriptData: T): T => {
    if (!scriptData) return scriptData;
    if (typeof structuredClone === 'function') {
      return structuredClone(scriptData);
    }
    return JSON.parse(JSON.stringify(scriptData)) as T;
  };

  const invalidateShotGenerationMeta = <T extends ProjectState['scriptData']>(scriptData: T): T => {
    if (!scriptData) return scriptData;
    return {
      ...scriptData,
      generationMeta: {
        ...(scriptData.generationMeta || {}),
        shotsKey: undefined,
        generatedAt: Date.now()
      }
    } as T;
  };

  useEffect(() => {
    const handler = () => {
      loadPickerProject().then(sp => { if (sp) setShowCharLibraryPicker(true); });
    };
    window.addEventListener('openCharacterLibraryPicker', handler);
    return () => window.removeEventListener('openCharacterLibraryPicker', handler);
  }, [project.projectId]);

  // Trạng thái chọn ngang/dọc (đọc từ cấu hình lưu trữ)
  const [aspectRatio, setAspectRatioState] = useState<AspectRatio>(() => getUserAspectRatio());
  
  // Bao bọc setAspectRatio, đồng thời lưu trữ vào cấu hình mô hình
  const setAspectRatio = (ratio: AspectRatio) => {
    setAspectRatioState(ratio);
    setUserAspectRatio(ratio);
  };
  

  // Lấy cấu hình dự án
  const language = getProjectLanguage(project.language, project.scriptData?.language);
  const visualStyle = getProjectVisualStyle(project.visualStyle, project.scriptData?.visualStyle);
  const genre = project.scriptData?.genre || DEFAULTS.genre;
  const shotPromptModel = project.shotGenerationModel || project.scriptData?.shotGenerationModel || DEFAULTS.modelVersion;

  /**
   * Khi thành phần tải, phát hiện và đặt lại trạng thái tạo bị kẹt
   * Giải quyết vấn đề: sau khi đóng trang và mở lại, trạng thái vẫn là "generating" khiến không thể tạo lại
   */
  useEffect(() => {
    if (!project.scriptData) return;

    const hasStuckCharacters = project.scriptData.characters.some(char => {
      // Kiểm tra xem nhân vật có bị kẹt không
      const isCharStuck = char.status === 'generating' && !char.referenceImage;
      // Kiểm tra xem biến thể nhân vật có bị kẹt không
      const hasStuckVariations = char.variations?.some(v => v.status === 'generating' && !v.referenceImage);
      return isCharStuck || hasStuckVariations;
    });

    const hasStuckScenes = project.scriptData.scenes.some(scene => 
      scene.status === 'generating' && !scene.referenceImage
    );

    const hasStuckProps = (project.scriptData.props || []).some(prop =>
      prop.status === 'generating' && !prop.referenceImage
    );

    if (hasStuckCharacters || hasStuckScenes || hasStuckProps) {
      console.log('🔧 Phát hiện trạng thái tạo bị kẹt, đang đặt lại...');
      const newData = cloneScriptData(project.scriptData);
      
      // Đặt lại trạng thái nhân vật
      newData.characters = newData.characters.map(char => ({
        ...char,
        status: char.status === 'generating' ? 'failed' as const : char.status,
        variations: char.variations?.map(v => ({
          ...v,
          status: v.status === 'generating' ? 'failed' as const : v.status
        }))
      }));
      
      // Đặt lại trạng thái bối cảnh
      newData.scenes = newData.scenes.map(scene => ({
        ...scene,
        status: scene.status === 'generating' ? 'failed' as const : scene.status
      }));

      // Đặt lại trạng thái đạo cụ
      if (newData.props) {
        newData.props = newData.props.map(prop => ({
          ...prop,
          status: prop.status === 'generating' ? 'failed' as const : prop.status
        }));
      }
      
      updateProject({ scriptData: newData });
    }
  }, []); // Vào trang tài nguyên một lần, dọn dẹp trạng thái generating còn sót lại sau khi rời trang

  /**
   * Báo cáo trạng thái tạo cho thành phần cha, dùng để khóa điều hướng
   * Phát hiện trạng thái tạo của nhân vật, bối cảnh, đạo cụ, biến thể nhân vật
   */
  useEffect(() => {
    const hasGeneratingCharacters = project.scriptData?.characters.some(char => {
      const isCharGenerating = char.status === 'generating';
      const hasGeneratingVariations = char.variations?.some(v => v.status === 'generating');
      return isCharGenerating || hasGeneratingVariations;
    }) ?? false;

    const hasGeneratingScenes = project.scriptData?.scenes.some(scene => 
      scene.status === 'generating'
    ) ?? false;

    const hasGeneratingProps = (project.scriptData?.props || []).some(prop =>
      prop.status === 'generating'
    );

    const generating = !!batchProgress || hasGeneratingCharacters || hasGeneratingScenes || hasGeneratingProps;
    onGeneratingChange?.(generating);
  }, [batchProgress, project.scriptData]);

  // Tháo gỡ thành phần khi đặt lại trạng thái tạo
  useEffect(() => {
    return () => {
      onGeneratingChange?.(false);
    };
  }, []);

  const refreshLibrary = async () => {
    try {
      const items = await getAllAssetLibraryItems();
      setLibraryItems(items);
    } catch (e) {
      console.error('Failed to load asset library', e);
    } finally {
      setLibraryLoading(false);
    }
  };

  const openLibrary = (filter: 'all' | 'character' | 'scene' | 'prop', targetCharId: string | null = null) => {
    setLibraryFilter(filter);
    setReplaceTargetCharId(targetCharId);
    setLibraryLoading(true);
    setShowLibraryModal(true);
    void refreshLibrary();
  };

  /**
   * Tạo tài nguyên (nhân vật hoặc bối cảnh)
   */
  const handleGenerateAsset = async (type: 'character' | 'scene', id: string) => {
    const scriptSnapshot = project.scriptData;
    if (!scriptSnapshot) return;

    // Đặt trạng thái tạo
    updateProject(prev => {
      if (!prev.scriptData) return prev;
      const newData = cloneScriptData(prev.scriptData);
      if (type === 'character') {
        const c = newData.characters.find(c => compareIds(c.id, id));
        if (c) c.status = 'generating';
      } else {
        const s = newData.scenes.find(s => compareIds(s.id, id));
        if (s) s.status = 'generating';
      }
      return { ...prev, scriptData: newData };
    });

    try {
      let prompt = "";
      let negativePrompt = "";
      let characterReferenceImages: string[] = [];
      let characterHasTurnaroundReference = false;

      if (type === 'character') {
        const char = scriptSnapshot.characters.find(c => compareIds(c.id, id));
        if (char) {
          // Note: Previously we added existing referenceImage/turnaround here for I2I, 
          // but now we prioritize Text-to-Image for fresh generation as requested.
          if (char.turnaround?.status === 'completed' && char.turnaround.imageUrl) {
            characterHasTurnaroundReference = true;
          }
          
          if (char.visualPrompt) {
            prompt = char.visualPrompt;
            negativePrompt = char.negativePrompt || '';
          } else {
            const prompts = await generateVisualPrompts('character', char, genre, shotPromptModel, visualStyle, language);
            prompt = prompts.visualPrompt;
            negativePrompt = prompts.negativePrompt;

            // Lưu prompt được tạo
            updateProject(prev => {
              if (!prev.scriptData) return prev;
              const newData = cloneScriptData(prev.scriptData);
              const c = newData.characters.find(c => compareIds(c.id, id));
              if (c) {
                c.promptVersions = updatePromptWithVersion(
                  c.visualPrompt,
                  prompts.visualPrompt,
                  c.promptVersions,
                  'ai-generated',
                  'Auto-generated character prompt'
                );
                c.visualPrompt = prompts.visualPrompt;
                c.negativePrompt = prompts.negativePrompt;
              }
              return { ...prev, scriptData: newData };
            });
          }
        }
      } else {
        const scene = scriptSnapshot.scenes.find(s => compareIds(s.id, id));
        if (scene) {
          if (scene.visualPrompt) {
            prompt = scene.visualPrompt;
            negativePrompt = scene.negativePrompt || '';
          } else {
            const prompts = await generateVisualPrompts('scene', scene, genre, shotPromptModel, visualStyle, language);
            prompt = prompts.visualPrompt;
            negativePrompt = prompts.negativePrompt;

            // Lưu prompt được tạo
            updateProject(prev => {
              if (!prev.scriptData) return prev;
              const newData = cloneScriptData(prev.scriptData);
              const s = newData.scenes.find(s => compareIds(s.id, id));
              if (s) {
                s.promptVersions = updatePromptWithVersion(
                  s.visualPrompt,
                  prompts.visualPrompt,
                  s.promptVersions,
                  'ai-generated',
                  'Auto-generated scene prompt'
                );
                s.visualPrompt = prompts.visualPrompt;
                s.negativePrompt = prompts.negativePrompt;
              }
              return { ...prev, scriptData: newData };
            });
          }
        }
      }

      // Thêm tiền tố đặc trưng khu vực
      const regionalPrefix = getRegionalPrefix(language, type);
      let enhancedPrompt = regionalPrefix + prompt;

      // Scene image: enforce environment-only composition to avoid accidental people.
      if (type === 'scene') {
        enhancedPrompt += '. IMPORTANT: This is a pure environment/background scene with absolutely NO people, NO human figures, NO characters, NO silhouettes, NO crowds - empty scene only.';
      }

      // Tạo hình ảnh (sử dụng tỷ lệ ngang/dọc được chọn)
      // Luôn dùng Text-to-Image cho việc tạo tài nguyên (Request #7)
      const referenceImagesForGeneration: string[] = [];
      const imageUrl = await generateImage(
        enhancedPrompt,
        referenceImagesForGeneration,
        aspectRatio,
        false,
        type === 'character' ? characterHasTurnaroundReference : false,
        negativePrompt,
        type === 'character'
          ? { referencePackType: 'character' }
          : { referencePackType: 'scene' }
      );

      // Cập nhật trạng thái
      updateProject(prev => {
        if (!prev.scriptData) return prev;
        const newData = cloneScriptData(prev.scriptData);
        if (type === 'character') {
          const c = newData.characters.find(c => compareIds(c.id, id));
          if (c) {
            c.referenceImage = imageUrl;
            c.status = 'completed';
          }
        } else {
          const s = newData.scenes.find(s => compareIds(s.id, id));
          if (s) {
            s.referenceImage = imageUrl;
            s.status = 'completed';
          }
        }
        return { ...prev, scriptData: newData };
      });

    } catch (e: any) {
      console.error(e);
      // Đặt trạng thái thất bại
      updateProject(prev => {
        if (!prev.scriptData) return prev;
        const newData = cloneScriptData(prev.scriptData);
        if (type === 'character') {
          const c = newData.characters.find(c => compareIds(c.id, id));
          if (c) c.status = 'failed';
        } else {
          const s = newData.scenes.find(s => compareIds(s.id, id));
          if (s) s.status = 'failed';
        }
        return { ...prev, scriptData: newData };
      });
      if (onApiKeyError && onApiKeyError(e)) {
        return;
      }
    }
  };
  const handleBatchGenerate = async (type: 'character' | 'scene') => {
    const items = type === 'character' 
      ? project.scriptData?.characters 
      : project.scriptData?.scenes;
    
    if (!items) return;

    const itemsToGen = items.filter(i => !i.referenceImage);
    const isRegenerate = itemsToGen.length === 0;

    if (isRegenerate) {
      showAlert(`Xác nhận tạo lại toàn bộ hình ảnh ${type === 'character' ? 'nhân vật' : 'bối cảnh'}?`, {
        type: 'warning',
        showCancel: true,
        onConfirm: async () => {
          await executeBatchGenerate(items, type);
        }
      });
      return;
    }

    await executeBatchGenerate(itemsToGen, type);
  };

  const executeBatchGenerate = async (targetItems: any[], type: 'character' | 'scene') => {
    setBatchProgress({ current: 0, total: targetItems.length });

    for (let i = 0; i < targetItems.length; i++) {
      if (i > 0) await delay(DEFAULTS.batchGenerateDelay);
      
      await handleGenerateAsset(type, targetItems[i].id);
      setBatchProgress({ current: i + 1, total: targetItems.length });
    }

    setBatchProgress(null);
  };

  /**
   * Tải lên hình ảnh nhân vật
   */
  const handleUploadCharacterImage = async (charId: string, file: File) => {
    try {
      const base64 = await handleImageUpload(file);

      updateProject((prev) => {
        if (!prev.scriptData) return prev;
        const newData = cloneScriptData(prev.scriptData);
        const char = newData.characters.find(c => compareIds(c.id, charId));
        if (char) {
          char.referenceImage = base64;
          char.status = 'completed';
        }
        return { ...prev, scriptData: newData };
      });
    } catch (e: any) {
      showAlert(e.message, { type: 'error' });
    }
  };

  /**
   * Tải lên hình ảnh bối cảnh
   */
  const handleUploadSceneImage = async (sceneId: string, file: File) => {
    try {
      const base64 = await handleImageUpload(file);

      updateProject((prev) => {
        if (!prev.scriptData) return prev;
        const newData = cloneScriptData(prev.scriptData);
        const scene = newData.scenes.find(s => compareIds(s.id, sceneId));
        if (scene) {
          scene.referenceImage = base64;
          scene.status = 'completed';
        }
        return { ...prev, scriptData: newData };
      });
    } catch (e: any) {
      showAlert(e.message, { type: 'error' });
    }
  };

  const handleAddCharacterToLibrary = (char: Character) => {
    const saveItem = async () => {
      try {
        const item = createLibraryItemFromCharacter(char, project);
        await saveAssetToLibrary(item);
        showAlert(`Đã thêm vào kho tài nguyên: ${char.name}`, { type: 'success' });
        refreshLibrary();
      } catch (e: any) {
        showAlert(e?.message || 'Thêm vào kho tài nguyên thất bại', { type: 'error' });
      }
    };

    if (!char.referenceImage) {
      showAlert('Nhân vật này chưa có hình ảnh tham khảo, bạn vẫn muốn thêm vào kho tài nguyên chứ?', {
        type: 'warning',
        showCancel: true,
        onConfirm: saveItem
      });
      return;
    }

    void saveItem();
  };

  const handleAddSceneToLibrary = (scene: Scene) => {
    const saveItem = async () => {
      try {
        const item = createLibraryItemFromScene(scene, project);
        await saveAssetToLibrary(item);
        showAlert(`Đã thêm vào kho tài nguyên: ${scene.location}`, { type: 'success' });
        refreshLibrary();
      } catch (e: any) {
        showAlert(e?.message || 'Thêm vào kho tài nguyên thất bại', { type: 'error' });
      }
    };

    if (!scene.referenceImage) {
      showAlert('Bối cảnh này chưa có hình ảnh tham khảo, bạn vẫn muốn thêm vào kho tài nguyên chứ?', {
        type: 'warning',
        showCancel: true,
        onConfirm: saveItem
      });
      return;
    }

    void saveItem();
  };

  const handleImportFromLibrary = (item: AssetLibraryItem) => {
    try {
      const updated = applyLibraryItemToProject(project, item);
      updateProject(() => ({
        ...updated,
        scriptData: invalidateShotGenerationMeta(updated.scriptData)
      }));
      showAlert(`Đã nhập: ${item.name}`, { type: 'success' });
    } catch (e: any) {
      showAlert(e?.message || 'Nhập thất bại', { type: 'error' });
    }
  };

  const handleReplaceCharacterFromLibrary = (item: AssetLibraryItem, targetId: string) => {
    if (item.type !== 'character') {
      showAlert('Vui lòng chọn tài nguyên nhân vật để thay thế', { type: 'warning' });
      return;
    }
    if (!project.scriptData) return;

    const newData = cloneScriptData(project.scriptData);
    const index = newData.characters.findIndex((c) => compareIds(c.id, targetId));
    if (index === -1) return;

    const cloned = cloneCharacterForProject(item.data as Character);
    const previous = newData.characters[index];

    newData.characters[index] = {
      ...cloned,
      id: previous.id
    };

    const nextShots = project.shots.map((shot) => {
      if (!shot.characterVariations || !shot.characterVariations[targetId]) return shot;
      const { [targetId]: _removed, ...rest } = shot.characterVariations;
      return {
        ...shot,
        characterVariations: Object.keys(rest).length > 0 ? rest : undefined
      };
    });

    let nextRefs = project.characterRefs || [];
    if (previous.libraryId) {
      const hasOtherLinked = newData.characters.some(c => c.libraryId === previous.libraryId);
      if (!hasOtherLinked) {
        nextRefs = nextRefs.filter(ref => ref.characterId !== previous.libraryId);
      }
    }

    updateProject({
      scriptData: invalidateShotGenerationMeta(newData),
      shots: nextShots,
      characterRefs: nextRefs
    });
    showAlert(`Đã thay thế nhân vật: ${previous.name} → ${cloned.name}`, { type: 'success' });
    setShowLibraryModal(false);
    setReplaceTargetCharId(null);
  };

  const handleDeleteLibraryItem = async (itemId: string) => {
    try {
      await deleteAssetFromLibrary(itemId);
      setLibraryItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (e: any) {
      showAlert(e?.message || 'Xóa tài nguyên thất bại', { type: 'error' });
    }
  };

  /**
   * Lưu prompt nhân vật
   */
  const handleSaveCharacterPrompt = (charId: string, newPrompt: string) => {
    if (!project.scriptData) return;
    const newData = cloneScriptData(project.scriptData);
    const char = newData.characters.find(c => compareIds(c.id, charId));
    if (char) {
      char.promptVersions = updatePromptWithVersion(
        char.visualPrompt,
        newPrompt,
        char.promptVersions,
        'manual-edit'
      );
      char.visualPrompt = newPrompt;
      updateProject({ scriptData: invalidateShotGenerationMeta(newData) });
    }
  };

  /**
   * Cập nhật thông tin cơ bản nhân vật
   */
  const handleUpdateCharacterInfo = (charId: string, updates: { name?: string; gender?: string; age?: string; personality?: string }) => {
    if (!project.scriptData) return;
    const newData = cloneScriptData(project.scriptData);
    const char = newData.characters.find(c => compareIds(c.id, charId));
    if (char) {
      if (updates.name !== undefined) char.name = updates.name;
      if (updates.gender !== undefined) char.gender = updates.gender;
      if (updates.age !== undefined) char.age = updates.age;
      if (updates.personality !== undefined) char.personality = updates.personality;
      updateProject({ scriptData: invalidateShotGenerationMeta(newData) });
    }
  };

  /**
   * Lưu prompt bối cảnh
   */
  const handleSaveScenePrompt = (sceneId: string, newPrompt: string) => {
    if (!project.scriptData) return;
    const newData = cloneScriptData(project.scriptData);
    const scene = newData.scenes.find(s => compareIds(s.id, sceneId));
    if (scene) {
      scene.promptVersions = updatePromptWithVersion(
        scene.visualPrompt,
        newPrompt,
        scene.promptVersions,
        'manual-edit'
      );
      scene.visualPrompt = newPrompt;
      updateProject({ scriptData: invalidateShotGenerationMeta(newData) });
    }
  };

  /**
   * Cập nhật thông tin cơ bản bối cảnh
   */
  const handleUpdateSceneInfo = (sceneId: string, updates: { location?: string; time?: string; atmosphere?: string }) => {
    if (!project.scriptData) return;
    const newData = cloneScriptData(project.scriptData);
    const scene = newData.scenes.find(s => compareIds(s.id, sceneId));
    if (scene) {
      if (updates.location !== undefined) scene.location = updates.location;
      if (updates.time !== undefined) scene.time = updates.time;
      if (updates.atmosphere !== undefined) scene.atmosphere = updates.atmosphere;
      updateProject({ scriptData: invalidateShotGenerationMeta(newData) });
    }
  };

  /**
   * Tạo mới nhân vật
   */
  const handleAddCharacter = () => {
    if (!project.scriptData) return;
    
    const newChar: Character = {
      id: generateId('char'),
      name: 'Nhân vật mới',
      gender: 'Chưa đặt',
      age: 'Chưa đặt',
      personality: 'Đang bổ sung',
      visualPrompt: '',
      variations: [],
      status: 'pending'
    };

    const newData = cloneScriptData(project.scriptData);
    newData.characters.push(newChar);
    updateProject({ scriptData: invalidateShotGenerationMeta(newData) });
    showAlert('Đã tạo nhân vật mới, vui lòng sửa Prompt và tạo hình ảnh', { type: 'success' });
  };

  /**
   * Xóa nhân vật
   */
  const handleDeleteCharacter = (charId: string) => {
    if (!project.scriptData) return;
    const char = project.scriptData.characters.find(c => compareIds(c.id, charId));
    if (!char) return;

    showAlert(
      `Xác nhận xóa nhân vật "${char.name}"? \n\nLưu ý: Thao tác này sẽ ảnh hưởng đến mọi phân cảnh sử dụng nhân vật này, có thể gây lỗi liên kết phân cảnh.`,
      {
        type: 'warning',
        title: 'Xóa nhân vật',
        showCancel: true,
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        onConfirm: () => {
          const newData = cloneScriptData(project.scriptData!);
          newData.characters = newData.characters.filter(c => !compareIds(c.id, charId));
          const nextShots = project.shots.map(shot => {
            const nextCharacters = shot.characters.filter(cid => !compareIds(cid, charId));
            if (!shot.characterVariations) {
              if (nextCharacters.length === shot.characters.length) return shot;
              return { ...shot, characters: nextCharacters };
            }

            const nextVariations: Record<string, string> = {};
            Object.entries(shot.characterVariations as Record<string, string>).forEach(([key, value]) => {
              if (!compareIds(key, charId)) nextVariations[key] = value;
            });

            const hasVariationChanged = Object.keys(nextVariations).length !== Object.keys(shot.characterVariations).length;
            const hasCharacterChanged = nextCharacters.length !== shot.characters.length;
            if (!hasVariationChanged && !hasCharacterChanged) return shot;

            return {
              ...shot,
              characters: nextCharacters,
              characterVariations: Object.keys(nextVariations).length > 0 ? nextVariations : undefined,
            };
          });

          let nextRefs = project.characterRefs || [];
          if (char.libraryId) {
            const hasOtherLinkedCharacter = newData.characters.some(c => c.libraryId === char.libraryId);
            if (!hasOtherLinkedCharacter) {
              nextRefs = nextRefs.filter(ref => ref.characterId !== char.libraryId);
            }
          }

          updateProject({
            scriptData: invalidateShotGenerationMeta(newData),
            shots: nextShots,
            characterRefs: nextRefs
          });
          showAlert(`Nhân vật "${char.name}" đã xóa`, { type: 'success' });
        }
      }
    );
  };

  /**
   * Tạo mới bối cảnh
   */
  const handleAddScene = () => {
    if (!project.scriptData) return;
    
    const newScene: Scene = {
      id: generateId('scene'),
      location: 'Bối cảnh mới',
      time: 'Chưa đặt',
      atmosphere: 'Đang bổ sung',
      visualPrompt: '',
      status: 'pending'
    };

    const newData = cloneScriptData(project.scriptData);
    newData.scenes.push(newScene);
    updateProject({ scriptData: invalidateShotGenerationMeta(newData) });
    showAlert('Bối cảnh mới đã được tạo, vui lòng chỉnh sửa prompt và tạo hình ảnh', { type: 'success' });
  };

  /**
   * Xóa bối cảnh
   */
  const handleDeleteScene = (sceneId: string) => {
    if (!project.scriptData) return;
    const scene = project.scriptData.scenes.find(s => compareIds(s.id, sceneId));
    if (!scene) return;

    showAlert(
      `Xác nhận xóa bối cảnh "${scene.location}" chứ?\n\nLưu ý: Thao tác này sẽ ảnh hưởng đến mọi phân cảnh sử dụng bối cảnh này, có thể gây lỗi liên kết phân cảnh.`,
      {
        type: 'warning',
        title: 'Xóa bối cảnh',
        showCancel: true,
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        onConfirm: () => {
          const newData = cloneScriptData(project.scriptData!);
          newData.scenes = newData.scenes.filter(s => !compareIds(s.id, sceneId));
          const nextShots = project.shots.filter(shot => !compareIds(shot.sceneId, sceneId));
          let nextRefs = project.sceneRefs || [];
          if (scene.libraryId) {
            const hasOtherLinkedScene = newData.scenes.some(s => s.libraryId === scene.libraryId);
            if (!hasOtherLinkedScene) {
              nextRefs = nextRefs.filter(ref => ref.sceneId !== scene.libraryId);
            }
          }
          updateProject({
            scriptData: invalidateShotGenerationMeta(newData),
            shots: nextShots,
            sceneRefs: nextRefs
          });
          showAlert(`Bối cảnh "${scene.location}" đã xóa`, { type: 'success' });
        }
      }
    );
  };

  // ============================
  // Các hàm xử lý đạo cụ
  // ============================

  /**
   * Tạo mới đạo cụ
   */
  const handleAddProp = () => {
    if (!project.scriptData) return;
    
    const newProp: Prop = {
      id: generateId('prop'),
      name: 'Đạo cụ mới',
      category: 'Khác',
      description: '',
      visualPrompt: '',
      status: 'pending'
    };

    const newData = cloneScriptData(project.scriptData);
    if (!newData.props) newData.props = [];
    newData.props.push(newProp);
    updateProject({ scriptData: invalidateShotGenerationMeta(newData) });
    showAlert('Đạo cụ mới đã được tạo, vui lòng chỉnh sửa mô tả và prompt rồi tạo hình ảnh', { type: 'success' });
  };

  /**
   * Xóa đạo cụ
   */
  const handleDeleteProp = (propId: string) => {
    if (!project.scriptData) return;
    const prop = (project.scriptData.props || []).find(p => compareIds(p.id, propId));
    if (!prop) return;

    showAlert(
      `Xác nhận xóa đạo cụ "${prop.name}" chứ?\n\nLưu ý: Thao tác này sẽ ảnh hưởng đến mọi phân cảnh sử dụng đạo cụ này.`,
      {
        type: 'warning',
        title: 'Xóa đạo cụ',
        showCancel: true,
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        onConfirm: () => {
          const newData = cloneScriptData(project.scriptData!);
          newData.props = (newData.props || []).filter(p => !compareIds(p.id, propId));
          // 清除所有镜头中对该道具的引用
          const nextShots = project.shots.map(shot => {
            if (!shot.props || !shot.props.some(id => compareIds(id, propId))) return shot;
            return { ...shot, props: shot.props.filter(id => !compareIds(id, propId)) };
          });

          let nextRefs = project.propRefs || [];
          if (prop.libraryId) {
            const hasOtherLinkedProp = (newData.props || []).some(p => p.libraryId === prop.libraryId);
            if (!hasOtherLinkedProp) {
              nextRefs = nextRefs.filter(ref => ref.propId !== prop.libraryId);
            }
          }

          updateProject({
            scriptData: invalidateShotGenerationMeta(newData),
            shots: nextShots,
            propRefs: nextRefs
          });
          showAlert(`Đạo cụ "${prop.name}" đã xóa`, { type: 'success' });
        }
      }
    );
  };

  /**
   * 生成道具图片
   */
  const handleGeneratePropAsset = async (propId: string) => {
    const scriptSnapshot = project.scriptData;
    if (!scriptSnapshot) return;

    // 璁剧疆鐢熸垚鐘舵€?
    updateProject(prev => {
      if (!prev.scriptData) return prev;
      const newData = cloneScriptData(prev.scriptData);
      const p = (newData.props || []).find(prop => compareIds(prop.id, propId));
      if (p) p.status = 'generating';
      return { ...prev, scriptData: newData };
    });

    try {
      const prop = scriptSnapshot.props?.find(p => compareIds(p.id, propId));
      if (!prop) return;

      let prompt = '';
      let negativePrompt = prop.negativePrompt || '';
      if (prop.visualPrompt) {
        prompt = prop.visualPrompt;
      } else {
        const prompts = await generateVisualPrompts(
          'prop',
          prop,
          genre,
          shotPromptModel,
          visualStyle,
          language,
          scriptSnapshot.artDirection
        );
        prompt = prompts.visualPrompt;
        negativePrompt = prompts.negativePrompt || negativePrompt;

        // 保存 AI 生成的道具提示词和负面词，保证与角色/场景一致走统一链路
        updateProject(prev => {
          if (!prev.scriptData) return prev;
          const newData = cloneScriptData(prev.scriptData);
          const p = (newData.props || []).find(item => compareIds(item.id, propId));
          if (p) {
            p.promptVersions = updatePromptWithVersion(
              p.visualPrompt,
              prompts.visualPrompt,
              p.promptVersions,
              'ai-generated',
              'Auto-generated prop prompt'
            );
            p.visualPrompt = prompts.visualPrompt;
            p.negativePrompt = prompts.negativePrompt;
          }
          return { ...prev, scriptData: newData };
        });
      }

      // Prop image: enforce object-only shot without human figures.
      prompt += '. IMPORTANT: This is a standalone prop/item shot with absolutely NO people, NO human figures, NO characters - object only on clean/simple background.';

      const imageUrl = await generateImage(
        prompt,
        [],
        aspectRatio,
        false,
        false,
        negativePrompt,
        { referencePackType: 'prop' }
      );

      // 鏇存柊鐘舵€?
      updateProject(prev => {
        if (!prev.scriptData) return prev;
        const updatedData = cloneScriptData(prev.scriptData);
        const updated = (updatedData.props || []).find(p => compareIds(p.id, propId));
        if (updated) {
          updated.referenceImage = imageUrl;
          updated.status = 'completed';
          if (!updated.visualPrompt) {
            updated.promptVersions = updatePromptWithVersion(
              updated.visualPrompt,
              prompt,
              updated.promptVersions,
              'ai-generated',
              'Auto-generated prop prompt'
            );
            updated.visualPrompt = prompt;
          }
          if (!updated.negativePrompt && negativePrompt) {
            updated.negativePrompt = negativePrompt;
          }
        }
        return { ...prev, scriptData: updatedData };
      });
    } catch (e: any) {
      console.error(e);
      updateProject(prev => {
        if (!prev.scriptData) return prev;
        const errData = cloneScriptData(prev.scriptData);
        const errP = (errData.props || []).find(p => compareIds(p.id, propId));
        if (errP) errP.status = 'failed';
        return { ...prev, scriptData: errData };
      });
      if (onApiKeyError && onApiKeyError(e)) return;
    }
  };
  const handleUploadPropImage = async (propId: string, file: File) => {
    try {
      const base64 = await handleImageUpload(file);
      updateProject((prev) => {
        if (!prev.scriptData) return prev;
        const newData = cloneScriptData(prev.scriptData);
        const prop = (newData.props || []).find(p => compareIds(p.id, propId));
        if (prop) {
          prop.referenceImage = base64;
          prop.status = 'completed';
        }
        return { ...prev, scriptData: newData };
      });
    } catch (e: any) {
      showAlert(e.message, { type: 'error' });
    }
  };

  /**
   * 保存道具提示词
   */
  const handleSavePropPrompt = (propId: string, newPrompt: string) => {
    if (!project.scriptData) return;
    const newData = cloneScriptData(project.scriptData);
    const prop = (newData.props || []).find(p => compareIds(p.id, propId));
    if (prop) {
      prop.promptVersions = updatePromptWithVersion(
        prop.visualPrompt,
        newPrompt,
        prop.promptVersions,
        'manual-edit'
      );
      prop.visualPrompt = newPrompt;
      updateProject({ scriptData: invalidateShotGenerationMeta(newData) });
    }
  };

  /**
   * 更新道具基本信息
   */
  const handleUpdatePropInfo = (propId: string, updates: { name?: string; category?: string; description?: string }) => {
    if (!project.scriptData) return;
    const newData = cloneScriptData(project.scriptData);
    const prop = (newData.props || []).find(p => compareIds(p.id, propId));
    if (prop) {
      if (updates.name !== undefined) prop.name = updates.name;
      if (updates.category !== undefined) prop.category = updates.category;
      if (updates.description !== undefined) prop.description = updates.description;
      updateProject({ scriptData: invalidateShotGenerationMeta(newData) });
    }
  };

  /**
   * 加入资产库（道具）
   */
  const handleAddPropToLibrary = (prop: Prop) => {
    const saveItem = async () => {
      try {
        const item = createLibraryItemFromProp(prop, project);
        await saveAssetToLibrary(item);
        showAlert(`Đã thêm vào kho tài nguyên: ${prop.name}`, { type: 'success' });
        refreshLibrary();
      } catch (e: any) {
        showAlert(e?.message || 'Thêm vào kho tài nguyên thất bại', { type: 'error' });
      }
    };

    if (!prop.referenceImage) {
      showAlert('Đạo cụ này chưa có hình ảnh tham khảo, bạn vẫn muốn thêm vào kho tài nguyên chứ?', {
        type: 'warning',
        showCancel: true,
        onConfirm: saveItem
      });
      return;
    }

    void saveItem();
  };

  /**
   * 批量生成道具
   */
  const handleBatchGenerateProps = async () => {
    const items = project.scriptData?.props || [];
    if (!items.length) return;

    const itemsToGen = items.filter(p => !p.referenceImage);
    const isRegenerate = itemsToGen.length === 0;

    if (isRegenerate) {
      showAlert('Xác nhận tạo lại toàn bộ hình ảnh đạo cụ?', {
        type: 'warning',
        showCancel: true,
        onConfirm: async () => {
          await executeBatchGenerateProps(items);
        }
      });
      return;
    }

    await executeBatchGenerateProps(itemsToGen);
  };

  const executeBatchGenerateProps = async (targetItems: Prop[]) => {
    setBatchProgress({ current: 0, total: targetItems.length });

    for (let i = 0; i < targetItems.length; i++) {
      if (i > 0) await delay(DEFAULTS.batchGenerateDelay);
      await handleGeneratePropAsset(targetItems[i].id);
      setBatchProgress({ current: i + 1, total: targetItems.length });
    }

    setBatchProgress(null);
  };

  /**
   * 添加角色变体
   */
  const handleAddVariation = (charId: string, name: string, prompt: string) => {
    if (!project.scriptData) return;
    const newData = cloneScriptData(project.scriptData);
    const char = newData.characters.find(c => compareIds(c.id, charId));
    if (!char) return;

    const newVar: CharacterVariation = {
      id: generateId('var'),
      name: name || "New Outfit",
      visualPrompt: prompt || char.visualPrompt || "",
      referenceImage: undefined
    };

    if (!char.variations) char.variations = [];
    char.variations.push(newVar);
    
    updateProject({ scriptData: newData });
  };

  /**
   * 删除角色变体
   */
  const handleDeleteVariation = (charId: string, varId: string) => {
    if (!project.scriptData) return;
    const newData = cloneScriptData(project.scriptData);
    const char = newData.characters.find(c => compareIds(c.id, charId));
    if (!char) return;
    
    char.variations = char.variations?.filter(v => !compareIds(v.id, varId));
    updateProject({ scriptData: newData });
  };

  /**
   * 生成角色变体
   */
  const handleGenerateVariation = async (charId: string, varId: string) => {
    const char = project.scriptData?.characters.find(c => compareIds(c.id, charId));
    const variation = char?.variations?.find(v => compareIds(v.id, varId));
    if (!char || !variation) return;

    // 设置生成状态
    if (project.scriptData) {
      const newData = cloneScriptData(project.scriptData);
      const c = newData.characters.find(c => compareIds(c.id, charId));
      const v = c?.variations?.find(v => compareIds(v.id, varId));
      if (v) v.status = 'generating';
      updateProject({ scriptData: newData });
    }
    try {
      const refImages = char.referenceImage ? [char.referenceImage] : [];
      const regionalPrefix = getRegionalPrefix(language, 'character');
      // 构建变体专用提示词：强调服装变化
      const enhancedPrompt = `${regionalPrefix}Character "${char.name}" wearing NEW OUTFIT: ${variation.visualPrompt}. This is a costume/outfit change - the character's face and identity must remain identical to the reference, but they should be wearing the described new outfit.`;
      const negativePrompt = variation.negativePrompt || char.negativePrompt || '';
      
      // 使用选择的横竖屏比例，启用变体模式
      const imageUrl = await generateImage(
        enhancedPrompt,
        refImages,
        aspectRatio,
        true,
        false,
        negativePrompt,
        { referencePackType: 'character' }
      );

      const newData = cloneScriptData(project.scriptData!);
      const c = newData.characters.find(c => compareIds(c.id, charId));
      const v = c?.variations?.find(v => compareIds(v.id, varId));
      if (v) {
        v.referenceImage = imageUrl;
        v.status = 'completed';
      }

      updateProject({ scriptData: newData });
    } catch (e: any) {
      console.error(e);
      // 设置失败状态
      if (project.scriptData) {
        const newData = cloneScriptData(project.scriptData);
        const c = newData.characters.find(c => compareIds(c.id, charId));
        const v = c?.variations?.find(v => compareIds(v.id, varId));
        if (v) v.status = 'failed';
        updateProject({ scriptData: newData });
      }
      if (onApiKeyError && onApiKeyError(e)) {
        return;
      }
      showAlert("Variation generation failed", { type: 'error' });
    }
  };

  /**
   * 上传角色变体图片
   */
  const handleUploadVariationImage = async (charId: string, varId: string, file: File) => {
    try {
      const base64 = await handleImageUpload(file);

      updateProject((prev) => {
        if (!prev.scriptData) return prev;
        const newData = cloneScriptData(prev.scriptData);
        const char = newData.characters.find(c => compareIds(c.id, charId));
        const variation = char?.variations?.find(v => compareIds(v.id, varId));
        if (variation) {
          variation.referenceImage = base64;
          variation.status = 'completed';
        }
        return { ...prev, scriptData: newData };
      });
    } catch (e: any) {
      showAlert(e.message, { type: 'error' });
    }
  };

  // ============================
  // 角色九宫格造型相关处理函数
  // ============================

  /**
   * 生成角色九宫格造型的视角描述（Step 1）
   */
  const handleGenerateTurnaroundPanels = async (charId: string) => {
    const char = project.scriptData?.characters.find(c => compareIds(c.id, charId));
    if (!char) return;

    // 设置状态为 generating_panels
    updateProject((prev) => {
      if (!prev.scriptData) return prev;
      const newData = cloneScriptData(prev.scriptData);
      const c = newData.characters.find(c => compareIds(c.id, charId));
      if (c) {
        c.turnaround = {
          panels: [],
          status: 'generating_panels',
        };
      }
      return { ...prev, scriptData: newData };
    });

    try {
      const panels = await generateCharacterTurnaroundPanels(
        char,
        visualStyle,
        project.scriptData?.artDirection,
        language,
        shotPromptModel
      );

      // 更新状态为 panels_ready
      updateProject((prev) => {
        if (!prev.scriptData) return prev;
        const newData = cloneScriptData(prev.scriptData);
        const c = newData.characters.find(c => compareIds(c.id, charId));
        if (c) {
          c.turnaround = {
            panels,
            status: 'panels_ready',
          };
        }
        return { ...prev, scriptData: newData };
      });
    } catch (e: any) {
      console.error('九宫格视角描述生成失败:', e);
      updateProject((prev) => {
        if (!prev.scriptData) return prev;
        const newData = cloneScriptData(prev.scriptData);
        const c = newData.characters.find(c => compareIds(c.id, charId));
        if (c && c.turnaround) {
          c.turnaround.status = 'failed';
        }
        return { ...prev, scriptData: newData };
      });
      if (onApiKeyError && onApiKeyError(e)) return;
      showAlert('Tạo mô tả góc nhìn lưới 9 ô thất bại', { type: 'error' });
    }
  };

  /**
   * 确认视角描述并生成九宫格图片（Step 2）
   */
  const handleConfirmTurnaroundPanels = async (charId: string, panels: CharacterTurnaroundPanel[]) => {
    const char = project.scriptData?.characters.find(c => compareIds(c.id, charId));
    if (!char) return;

    // 设置状态为 generating_image
    updateProject((prev) => {
      if (!prev.scriptData) return prev;
      const newData = cloneScriptData(prev.scriptData);
      const c = newData.characters.find(c => compareIds(c.id, charId));
      if (c && c.turnaround) {
        c.turnaround.status = 'generating_image';
        c.turnaround.panels = panels;
      }
      return { ...prev, scriptData: newData };
    });

    try {
      const imageUrl = await generateCharacterTurnaroundImage(
        char,
        panels,
        visualStyle,
        undefined, // Xóa referenceImage để dùng Text-to-Image theo request #7
        project.scriptData?.artDirection
      );

      // 更新状态为 completed
      updateProject((prev) => {
        if (!prev.scriptData) return prev;
        const newData = cloneScriptData(prev.scriptData);
        const c = newData.characters.find(c => compareIds(c.id, charId));
        if (c && c.turnaround) {
          c.turnaround.imageUrl = imageUrl;
          c.turnaround.status = 'completed';
        }
        return { ...prev, scriptData: newData };
      });
    } catch (e: any) {
      console.error('九宫格造型图片生成失败:', e);
      updateProject((prev) => {
        if (!prev.scriptData) return prev;
        const newData = cloneScriptData(prev.scriptData);
        const c = newData.characters.find(c => compareIds(c.id, charId));
        if (c && c.turnaround) {
          c.turnaround.status = 'failed';
        }
        return { ...prev, scriptData: newData };
      });
      if (onApiKeyError && onApiKeyError(e)) return;
      showAlert('Tạo hình ảnh lưới 9 ô thất bại', { type: 'error' });
    }
  };

  /**
   * 更新九宫格造型的单个面板
   */
  const handleUpdateTurnaroundPanel = (charId: string, index: number, updates: Partial<CharacterTurnaroundPanel>) => {
    updateProject((prev) => {
      if (!prev.scriptData) return prev;
      const newData = cloneScriptData(prev.scriptData);
      const c = newData.characters.find(c => compareIds(c.id, charId));
      if (c && c.turnaround && c.turnaround.panels[index]) {
        c.turnaround.panels[index] = { ...c.turnaround.panels[index], ...updates };
      }
      return { ...prev, scriptData: newData };
    });
  };

  /**
   * 重新生成九宫格造型（文案+图片全部重来）
   */
  const handleRegenerateTurnaround = (charId: string) => {
    handleGenerateTurnaroundPanels(charId);
  };

  /**
   * 仅重新生成九宫格造型图片（保留已有的视角描述文案）
   * 当用户对文案满意但图片效果不好时使用
   */
  const handleRegenerateTurnaroundImage = (charId: string) => {
    const char = project.scriptData?.characters.find(c => compareIds(c.id, charId));
    if (!char || !char.turnaround?.panels || char.turnaround.panels.length !== 9) return;
    
    // 直接使用已有的面板描述重新生成图片
    handleConfirmTurnaroundPanels(charId, char.turnaround.panels);
  };

  // 空状态
  if (!project.scriptData) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-tertiary)]">
        <p>Vui lòng hoàn thành phân tích kịch bản Giai đoạn 01 trước.</p>
      </div>
    );
  }
  
  const allCharactersReady = project.scriptData.characters.every(c => c.referenceImage);
  const allScenesReady = project.scriptData.scenes.every(s => s.referenceImage);
  const allPropsReady = (project.scriptData.props || []).length > 0 && (project.scriptData.props || []).every(p => p.referenceImage);
  const selectedChar = project.scriptData.characters.find(c => compareIds(c.id, selectedCharId));
  const getLibraryProjectName = (item: AssetLibraryItem): string => {
    const projectName = typeof item.projectName === 'string' ? item.projectName.trim() : '';
    return projectName || 'Unknown Project';
  };

  const projectNameOptions = Array.from<string>(
    new Set<string>(
      libraryItems.map((item) => getLibraryProjectName(item))
    )
  ).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const filteredLibraryItems = libraryItems.filter((item) => {
    if (libraryFilter !== 'all' && item.type !== libraryFilter) return false;
    if (libraryProjectFilter !== 'all') {
      const projectName = getLibraryProjectName(item);
      if (projectName !== libraryProjectFilter) return false;
    }
    if (!libraryQuery.trim()) return true;
    const query = libraryQuery.trim().toLowerCase();
    return item.name.toLowerCase().includes(query);
  });

  return (
    <div className={STYLES.mainContainer}>
      
      {/* Image Preview Modal */}
      <ImagePreviewModal 
        imageUrl={previewImage} 
        onClose={() => setPreviewImage(null)} 
      />

      {/* Global Progress Overlay */}
      {batchProgress && (
        <div className="absolute inset-0 z-50 bg-[var(--bg-base)]/80 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in">
          <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin mb-6" />
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Tạo tài nguyên theo lô...</h3>
          <div className="w-64 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-[var(--accent)] transition-all duration-300" 
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-[var(--text-tertiary)] font-mono text-xs">
            Lịch trình:{batchProgress.current} / {batchProgress.total}
          </p>
        </div>
      )}

      {/* Wardrobe Modal */}
      {selectedChar && (
        <WardrobeModal
          character={selectedChar}
          onClose={() => setSelectedCharId(null)}
          onAddVariation={handleAddVariation}
          onDeleteVariation={handleDeleteVariation}
          onGenerateVariation={handleGenerateVariation}
          onUploadVariation={handleUploadVariationImage}
          onImageClick={setPreviewImage}
        />
      )}

      {/* Turnaround Modal */}
      {turnaroundCharId && (() => {
        const turnaroundChar = project.scriptData?.characters.find(c => compareIds(c.id, turnaroundCharId));
        return turnaroundChar ? (
          <TurnaroundModal
            character={turnaroundChar}
            onClose={() => setTurnaroundCharId(null)}
            onGeneratePanels={handleGenerateTurnaroundPanels}
            onConfirmPanels={handleConfirmTurnaroundPanels}
            onUpdatePanel={handleUpdateTurnaroundPanel}
            onRegenerate={handleRegenerateTurnaround}
            onRegenerateImage={handleRegenerateTurnaroundImage}
            onImageClick={setPreviewImage}
          />
        ) : null;
      })()}

      {/* Asset Library Modal */}
      {showLibraryModal && (
        <div className={STYLES.modalOverlay} onClick={() => {
          setShowLibraryModal(false);
          setReplaceTargetCharId(null);
        }}>
          <div className={STYLES.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={STYLES.modalHeader}>
              <div className="flex items-center gap-3">
                <Archive className="w-4 h-4 text-[var(--accent-text)]" />
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">Kho tài nguyên</div>
                  <div className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-widest">
                    {libraryItems.length} tài nguyên
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLibraryModal(false);
                  setReplaceTargetCharId(null);
                }}
                className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={STYLES.modalBody}>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={libraryQuery}
                    onChange={(e) => setLibraryQuery(e.target.value)}
                    placeholder="Tìm kiếm tài nguyên..."
                    className="w-full pl-9 pr-3 py-2 bg-[var(--bg-deep)] border border-[var(--border-primary)] rounded text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-secondary)]"
                  />
                </div>
                <div className="min-w-[180px]">
                  <select
                    value={libraryProjectFilter}
                    onChange={(e) => setLibraryProjectFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-deep)] border border-[var(--border-primary)] rounded text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-secondary)]"
                  >
                    <option value="all">Tất cả dự án</option>
                    {projectNameOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  {(['all', 'character', 'scene', 'prop'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setLibraryFilter(type)}
                      className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border rounded ${
                        libraryFilter === type
                          ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-[var(--btn-primary-bg)]'
                          : 'bg-transparent text-[var(--text-tertiary)] border-[var(--border-primary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      {type === 'all' ? 'Tất cả' : type === 'character' ? 'Nhân vật' : type === 'scene' ? 'Bối cảnh' : 'Đạo cụ'}
                    </button>
                  ))}
                </div>
              </div>

              {libraryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-[var(--text-tertiary)] animate-spin" />
                </div>
              ) : filteredLibraryItems.length === 0 ? (
                <div className="border border-dashed border-[var(--border-primary)] rounded-xl p-10 text-center text-[var(--text-muted)] text-sm">
                  Chưa có tài nguyên. Bạn có thể chọn "Thêm vào kho tài nguyên" từ thẻ nhân vật hoặc bối cảnh.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLibraryItems.map((item) => {
                    const preview =
                      item.type === 'character'
                        ? (item.data as Character).referenceImage
                        : item.type === 'scene'
                        ? (item.data as Scene).referenceImage
                        : (item.data as Prop).referenceImage;
                    return (
                      <div
                        key={item.id}
                        className="bg-[var(--bg-deep)] border border-[var(--border-primary)] rounded-xl overflow-hidden hover:border-[var(--border-secondary)] transition-colors"
                      >
                        <div className="aspect-video bg-[var(--bg-elevated)] relative">
                          {preview ? (
                            <img src={preview} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                              {item.type === 'character' ? (
                                <Users className="w-8 h-8 opacity-30" />
                              ) : item.type === 'scene' ? (
                                <MapPin className="w-8 h-8 opacity-30" />
                              ) : (
                                <Package className="w-8 h-8 opacity-30" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <div className="text-sm text-[var(--text-primary)] font-bold line-clamp-1">{item.name}</div>
                            <div className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase tracking-widest mt-1">
                              {item.type === 'character' ? 'Nhân vật' : item.type === 'scene' ? 'Bối cảnh' : 'Đạo cụ'}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1 line-clamp-1">
                              {(item.projectName && item.projectName.trim()) || 'Dự án không xác định'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                replaceTargetCharId
                                  ? handleReplaceCharacterFromLibrary(item, replaceTargetCharId)
                                  : handleImportFromLibrary(item)
                              }
                              className="flex-1 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                              {replaceTargetCharId ? 'Thay thế nhân vật hiện tại' : 'Nhập vào dự án hiện tại'}
                            </button>
                            <button
                              onClick={() =>
                                showAlert('Xác nhận xóa tài nguyên này khỏi kho?', {
                                  type: 'warning',
                                  showCancel: true,
                                  onConfirm: () => handleDeleteLibraryItem(item.id)
                                })
                              }
                              className="p-2 border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--error-text)] hover:border-[var(--error-border)] rounded transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}  

      {/* Header */}
      <div className={STYLES.header}>
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-3">
            <Users className="w-5 h-5 text-[var(--accent)]" />
            Nhân vật và Bối cảnh
            <span className="text-xs text-[var(--text-muted)] font-mono font-normal uppercase tracking-wider bg-[var(--bg-base)]/30 px-2 py-1 rounded">
              Assets & Casting
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openLibrary('all')}
            disabled={!!batchProgress}
            className={STYLES.secondaryButton}
          >
            <Archive className="w-4 h-4" />
            Kho tài nguyên
          </button>
          {/* 横竖屏选择 */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase">比例</span>
            <AspectRatioSelector
              value={aspectRatio}
              onChange={setAspectRatio}
              allowSquare={(() => {
                // 根据当前激活的图片模型判断是否支持方形
                const activeModel = getActiveImageModel();
                return activeModel?.params?.supportedAspectRatios?.includes('1:1') ?? false;
              })()}
              disabled={!!batchProgress}
            />
          </div>
          <div className="w-px h-6 bg-[var(--bg-hover)]" />
          <div className="flex gap-2">
            <span className={STYLES.badge}>
              {project.scriptData.characters.length} CHARS
            </span>
            <span className={STYLES.badge}>
              {project.scriptData.scenes.length} SCENES
            </span>
            <span className={STYLES.badge}>
              {(project.scriptData.props || []).length} PROPS
            </span>
          </div>
        </div>
      </div>

      <div className={STYLES.content}>
        {/* Characters Section */}
        <section>
          <div className="flex items-end justify-between mb-6 border-b border-[var(--border-primary)] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                Thiết kế nhân vật (Casting)
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1 pl-3.5">Tạo hình ảnh tham khảo nhất quán cho các nhân vật trong kịch bản</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleAddCharacter}
                disabled={!!batchProgress}
                className="px-3 py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Users className="w-3 h-3" />
                Nhân vật mới
              </button>
              {project.projectId && (
                <button
                  onClick={() => {
                    if (project.projectId) {
                      loadSeriesProject(project.projectId).then(sp => { setPickerProject(sp); setShowCharLibraryPicker(true); }).catch(() => {});
                    }
                  }}
                  disabled={!!batchProgress}
                  className={STYLES.secondaryButton}
                >
                  <Link2 className="w-3 h-3" />
                  Thêm từ thư viện nhân vật
                </button>
              )}
              <button 
                onClick={() => openLibrary('character')}
                disabled={!!batchProgress}
                className={STYLES.secondaryButton}
              >
                <Archive className="w-3 h-3" />
                Chọn từ kho tài nguyên
              </button>
              <button 
                onClick={() => handleBatchGenerate('character')}
                disabled={!!batchProgress}
                className={allCharactersReady ? STYLES.secondaryButton : STYLES.primaryButton}
              >
                {allCharactersReady ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                {allCharactersReady ? 'Tạo lại tất cả nhân vật' : 'Tạo tất cả nhân vật'}
              </button>
            </div>
          </div>

          <div className={GRID_LAYOUTS.cards}>
            {project.scriptData.characters.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                isGenerating={char.status === 'generating'}
                onGenerate={() => handleGenerateAsset('character', char.id)}
                onUpload={(file) => handleUploadCharacterImage(char.id, file)}
                onPromptSave={(newPrompt) => handleSaveCharacterPrompt(char.id, newPrompt)}
                onOpenWardrobe={() => setSelectedCharId(char.id)}
                onOpenTurnaround={() => setTurnaroundCharId(char.id)}
                onImageClick={setPreviewImage}
                onDelete={() => handleDeleteCharacter(char.id)}
                onUpdateInfo={(updates) => handleUpdateCharacterInfo(char.id, updates)}
                onAddToLibrary={() => handleAddCharacterToLibrary(char)}
                onReplaceFromLibrary={() => openLibrary('character', char.id)}
              />
            ))}
          </div>
        </section>

        {/* Scenes Section */}
        <section>
          <div className="flex items-end justify-between mb-6 border-b border-[var(--border-primary)] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--success)] rounded-full" />
                Ý tưởng bối cảnh (Locations)
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1 pl-3.5">Tạo hình ảnh tham khảo môi trường cho các cảnh quay</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleAddScene}
                disabled={!!batchProgress}
                className="px-3 py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <MapPin className="w-3 h-3" />
                Bối cảnh mới
              </button>
              {project.projectId && (
                <button
                  onClick={() => { loadPickerProject().then(sp => { if (sp) setShowSceneLibraryPicker(true); }); }}
                  disabled={!!batchProgress}
                  className={STYLES.secondaryButton}
                >
                  <Link2 className="w-3 h-3" />
                  Thêm từ thư viện bối cảnh
                </button>
              )}
              <button 
                onClick={() => openLibrary('scene')}
                disabled={!!batchProgress}
                className={STYLES.secondaryButton}
              >
                <Archive className="w-3 h-3" />
                Chọn từ kho tài nguyên
              </button>
              <button 
                onClick={() => handleBatchGenerate('scene')}
                disabled={!!batchProgress}
                className={allScenesReady ? STYLES.secondaryButton : STYLES.primaryButton}
              >
                {allScenesReady ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                {allScenesReady ? 'Tạo lại tất cả bối cảnh' : 'Tạo tất cả bối cảnh'}
              </button>
            </div>
          </div>

          <div className={GRID_LAYOUTS.cards}>
            {project.scriptData.scenes.map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                isGenerating={scene.status === 'generating'}
                onGenerate={() => handleGenerateAsset('scene', scene.id)}
                onUpload={(file) => handleUploadSceneImage(scene.id, file)}
                onPromptSave={(newPrompt) => handleSaveScenePrompt(scene.id, newPrompt)}
                onImageClick={setPreviewImage}
                onDelete={() => handleDeleteScene(scene.id)}
                onUpdateInfo={(updates) => handleUpdateSceneInfo(scene.id, updates)}
                onAddToLibrary={() => handleAddSceneToLibrary(scene)}
              />
            ))}
          </div>
        </section>

        {/* Props Section */}
        <section>
          <div className="flex items-end justify-between mb-6 border-b border-[var(--border-primary)] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                Kho đạo cụ (Props)
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1 pl-3.5">Quản lý đạo cụ/vật dụng cần sự nhất quán trong phân cảnh</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleAddProp}
                disabled={!!batchProgress}
                className="px-3 py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Package className="w-3 h-3" />
                Đạo cụ mới
              </button>
              {project.projectId && (
                <button
                  onClick={() => { loadPickerProject().then(sp => { if (sp) setShowPropLibraryPicker(true); }); }}
                  disabled={!!batchProgress}
                  className={STYLES.secondaryButton}
                >
                  <Link2 className="w-3 h-3" />
                  Thêm từ thư viện đạo cụ
                </button>
              )}
              <button 
                onClick={() => openLibrary('prop')}
                disabled={!!batchProgress}
                className={STYLES.secondaryButton}
              >
                <Archive className="w-3 h-3" />
                Chọn từ kho tài nguyên
              </button>
              {(project.scriptData.props || []).length > 0 && (
                <button 
                  onClick={handleBatchGenerateProps}
                  disabled={!!batchProgress}
                  className={allPropsReady ? STYLES.secondaryButton : STYLES.primaryButton}
                >
                  {allPropsReady ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  {allPropsReady ? 'Tạo lại tất cả đạo cụ' : 'Tạo tất cả đạo cụ'}
                </button>
              )}
            </div>
          </div>

          {(project.scriptData.props || []).length === 0 ? (
            <div className="border border-dashed border-[var(--border-primary)] rounded-xl p-10 text-center text-[var(--text-muted)] text-sm">
              Chưa có đạo cụ. Nhấn "Đạo cụ mới" để thêm các vật dụng cần tính nhất quán qua nhiều phân cảnh.
            </div>
          ) : (
            <div className={GRID_LAYOUTS.cards}>
              {(project.scriptData.props || []).map((prop) => (
                <PropCard
                  key={prop.id}
                  prop={prop}
                  isGenerating={prop.status === 'generating'}
                  onGenerate={() => handleGeneratePropAsset(prop.id)}
                  onUpload={(file) => handleUploadPropImage(prop.id, file)}
                  onPromptSave={(newPrompt) => handleSavePropPrompt(prop.id, newPrompt)}
                  onImageClick={setPreviewImage}
                  onDelete={() => handleDeleteProp(prop.id)}
                  onUpdateInfo={(updates) => handleUpdatePropInfo(prop.id, updates)}
                  onAddToLibrary={() => handleAddPropToLibrary(prop)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Character Library Picker */}
      {showCharLibraryPicker && (
        <CharacterLibraryPickerModal
          isOpen={showCharLibraryPicker}
          onClose={() => setShowCharLibraryPicker(false)}
          project={pickerProject}
          existingCharacterIds={(project.scriptData?.characters || []).filter(c => c.libraryId).map(c => c.libraryId!)}
          onSelect={(libChar) => {
            appendLinkedLibraryAsset({
              asset: {
                ...libChar,
                variations: libChar.variations?.map(v => ({ ...v })) || [],
              },
              idPrefix: 'char',
              field: 'characters',
              refField: 'characterRefs',
              upsertRef: upsertCharacterRef,
              onDone: () => setShowCharLibraryPicker(false),
            });
          }}
        />
      )}

      {/* Scene Library Picker */}
      {showSceneLibraryPicker && (
        <ProjectAssetPicker
          isOpen={showSceneLibraryPicker}
          onClose={() => setShowSceneLibraryPicker(false)}
          project={pickerProject}
          assetType="scene"
          existingIds={(project.scriptData?.scenes || []).filter(s => !!s.libraryId).map(s => s.libraryId!)}
          onSelectScene={(libScene) => {
            appendLinkedLibraryAsset({
              asset: libScene,
              idPrefix: 'scene',
              field: 'scenes',
              refField: 'sceneRefs',
              upsertRef: upsertSceneRef,
              onDone: () => setShowSceneLibraryPicker(false),
            });
          }}
        />
      )}

      {/* Prop Library Picker */}
      {showPropLibraryPicker && (
        <ProjectAssetPicker
          isOpen={showPropLibraryPicker}
          onClose={() => setShowPropLibraryPicker(false)}
          project={pickerProject}
          assetType="prop"
          existingIds={(project.scriptData?.props || []).filter(p => !!p.libraryId).map(p => p.libraryId!)}
          onSelectProp={(libProp) => {
            appendLinkedLibraryAsset({
              asset: libProp,
              idPrefix: 'prop',
              field: 'props',
              refField: 'propRefs',
              upsertRef: upsertPropRef,
              onDone: () => setShowPropLibraryPicker(false),
            });
          }}
        />
      )}
    </div>
  );
};

export default StageAssets;
