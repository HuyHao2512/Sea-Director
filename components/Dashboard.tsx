import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Folder, ChevronRight, Calendar, AlertTriangle, X, HelpCircle, Cpu, Archive, Search, Users, MapPin, Package, Database, Settings, Sun, Moon, Film } from 'lucide-react';
import { SeriesProject, AssetLibraryItem, Character, Scene, Prop, ProjectState } from '../types';
import { getAllSeriesProjects, createNewSeriesProject, saveSeriesProject, deleteSeriesProject, createNewSeries, saveSeries, createNewEpisode, saveEpisode, getAllAssetLibraryItems, deleteAssetFromLibrary, exportIndexedDBData } from '../services/storageService';
import { useAlert } from './GlobalAlert';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  useBackupTransfer,
  DEFAULT_BACKUP_TRANSFER_MESSAGES,
  globalBackupFileName,
} from '../hooks/useBackupTransfer';

interface Props {
  onOpenProject: (project: ProjectState) => void;
  onShowOnboarding?: () => void;
  onShowModelConfig?: () => void;
}

const Dashboard: React.FC<Props> = ({ onOpenProject, onShowOnboarding, onShowModelConfig }) => {
  const { showAlert } = useAlert();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<SeriesProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showGroupQr, setShowGroupQr] = useState(false);
  const [libraryItems, setLibraryItems] = useState<AssetLibraryItem[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'character' | 'scene' | 'prop'>('all');
  const [libraryProjectFilter, setLibraryProjectFilter] = useState('all');
  const [assetToUse, setAssetToUse] = useState<AssetLibraryItem | null>(null);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const list = await getAllSeriesProjects();
      setProjects(list);
    } catch (e) {
      console.error("Failed to load projects", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLibrary = async () => {
    setIsLibraryLoading(true);
    try {
      const items = await getAllAssetLibraryItems();
      setLibraryItems(items);
    } catch (e) {
      console.error('Failed to load asset library', e);
    } finally {
      setIsLibraryLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (showLibraryModal) {
      loadLibrary();
    }
  }, [showLibraryModal]);

  const handleCreate = async () => {
    const sp = createNewSeriesProject();
    await saveSeriesProject(sp);
    const s = createNewSeries(sp.id, 'Phần 1', 0);
    await saveSeries(s);
    const ep = createNewEpisode(sp.id, s.id, 1, 'Tập 1');
    await saveEpisode(ep);
    navigate(`/project/${sp.id}`);
  };

  const requestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const confirmDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const proj = projects.find(p => p.id === id);
    const projectName = proj?.title || 'Dự án chưa đặt tên';
    try {
        await deleteSeriesProject(id);
        await loadProjects();
        console.log(`Project "${projectName}" deleted`);
    } catch (error) {
        showAlert(`Xóa dự án thất bại: ${error instanceof Error ? error.message : 'Lỗi chưa xác định'}`, { type: 'error' });
    } finally {
        setDeleteConfirmId(null);
    }
  };

  const handleDeleteLibraryItem = (itemId: string) => {
    showAlert('Bạn có chắc chắn muốn xóa tài nguyên này khỏi thư viện không?', {
      type: 'warning',
      showCancel: true,
      onConfirm: async () => {
        try {
          await deleteAssetFromLibrary(itemId);
          setLibraryItems((prev) => prev.filter((item) => item.id !== itemId));
        } catch (error) {
          showAlert(`Xóa tài nguyên thất bại: ${error instanceof Error ? error.message : 'Lỗi chưa xác định'}`, { type: 'error' });
        }
      }
    });
  };

  const handleUseAsset = async (projectId: string) => {
    if (!assetToUse) return;
    setAssetToUse(null);
    navigate(`/project/${projectId}`);
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getLibraryProjectName = (item: AssetLibraryItem): string => {
    const projectName = typeof item.projectName === 'string' ? item.projectName.trim() : '';
    return projectName || 'Unknown Project';
  };

  const projectNameOptions = Array.from<string>(
    new Set<string>(
      libraryItems.map((item) => getLibraryProjectName(item))
    )
  ).sort((a, b) => a.localeCompare(b, 'vi-VN'));

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

  const {
    importInputRef,
    isDataExporting,
    isDataImporting,
    handleExportData,
    handleImportData,
    handleImportFileChange,
  } = useBackupTransfer({
    exporter: exportIndexedDBData,
    exportFileName: globalBackupFileName,
    showAlert,
    messages: DEFAULT_BACKUP_TRANSFER_MESSAGES,
    onImportSuccess: async () => {
      await loadProjects();
      if (showLibraryModal) {
        await loadLibrary();
      }
    },
  });

  const isSpaceX = theme === 'spacex';

  return (
    <div className={`min-h-screen text-[var(--text-secondary)] font-sans selection:bg-[var(--selection-bg)] ${
      isSpaceX ? 'bg-[var(--space-black)]' : 'bg-[var(--bg-base)] p-8 md:p-12'
    }`}>
      {isSpaceX ? (
        <>
          {/* SpaceX Hero Section */}
          <section className="relative h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--space-black)]"></div>
            <div className="relative z-10 text-center space-y-8">
              <h1 className="text-6xl font-bold text-[var(--spectral-white)] uppercase tracking-[0.96px]">
                KHO DỰ ÁN
              </h1>
              <p className="text-lg text-[var(--text-secondary)] uppercase tracking-[1.17px] max-w-2xl mx-auto">
                Quản lý và tạo các dự án phim của bạn
              </p>
              <button
                onClick={handleCreate}
                className="px-8 py-4 bg-[var(--ghost-surface)] border border-[var(--ghost-border)] rounded-[32px] text-[var(--spectral-white)] text-sm font-bold uppercase tracking-[1.17px] hover:bg-[var(--ghost-hover)] transition-colors"
              >
                TẠO DỰ ÁN MỚI
              </button>
            </div>
          </section>

          {/* SpaceX Projects Section */}
          <section className="relative min-h-screen py-20 px-12">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl font-bold text-[var(--spectral-white)] uppercase tracking-[0.96px] mb-16">
                CÁC DỰ ÁN CỦA BẠN
              </h2>

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-6 h-6 text-[var(--text-muted)] animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* Create New Card */}
                  <div
                    onClick={handleCreate}
                    className="group relative h-[280px] overflow-hidden cursor-pointer border border-[var(--ghost-border)] hover:border-[var(--spectral-white)] transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--ghost-surface)] to-transparent"></div>
                    <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
                      <Plus className="w-12 h-12 text-[var(--text-muted)] group-hover:text-[var(--spectral-white)] mb-4 transition-colors" />
                      <span className="text-xs text-[var(--text-muted)] uppercase tracking-[1.17px] group-hover:text-[var(--spectral-white)] transition-colors">TẠO DỰ ÁN MỚI</span>
                    </div>
                  </div>

                  {/* Project Cards */}
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => navigate(`/project/${proj.id}`)}
                      className="group relative h-[280px] overflow-hidden cursor-pointer border border-[var(--ghost-border)] hover:border-[var(--spectral-white)] transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--ghost-surface)] to-transparent group-hover:from-[var(--ghost-hover)] transition-colors"></div>

                      {deleteConfirmId === proj.id && (
                        <div className="absolute inset-0 z-20 bg-[var(--space-black)]/95 flex flex-col items-center justify-center p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                          <AlertTriangle className="w-8 h-8 text-[var(--error)]" />
                          <div className="text-center space-y-2">
                            <p className="text-[var(--spectral-white)] font-bold text-xs uppercase tracking-[1.17px]">XÁC NHẬN XÓA DỰ ÁN?</p>
                            <p className="text-[var(--text-muted)] text-[10px]">Dữ liệu sẽ bị xóa vĩnh viễn</p>
                          </div>
                          <div className="flex gap-2 w-full pt-2">
                            <button onClick={cancelDelete} className="flex-1 py-2 bg-transparent border border-[var(--ghost-border)] text-[var(--text-secondary)] hover:text-[var(--spectral-white)] text-[10px] font-bold uppercase tracking-[1px] transition-colors">HỦY</button>
                            <button onClick={(e) => confirmDelete(e, proj.id)} className="flex-1 py-2 bg-transparent border border-[var(--error-border)] text-[var(--error-text)] text-[10px] font-bold uppercase tracking-[1px] transition-colors">XÓA</button>
                          </div>
                        </div>
                      )}

                      <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                        <div>
                          <button onClick={(e) => requestDelete(e, proj.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-[var(--text-muted)] hover:text-[var(--error-text)] transition-all z-10" title="Xóa dự án">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <h3 className="text-sm font-bold text-[var(--spectral-white)] uppercase tracking-[0.96px] mb-2 line-clamp-2">{proj.title}</h3>
                          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-[1px]">
                            {proj.characterLibrary?.length || 0} NHÂN VẬT
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-[1px]">{formatDate(proj.lastModified)}</span>
                          <ChevronRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--spectral-white)] transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SpaceX Footer Controls */}
          <section className="relative min-h-screen py-20 px-12 flex items-center justify-center">
            <div className="max-w-2xl text-center space-y-8">
              <h2 className="text-3xl font-bold text-[var(--spectral-white)] uppercase tracking-[0.96px]">CÀI ĐẶT</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowGroupQr(true)}
                  className="px-6 py-4 bg-[var(--ghost-surface)] border border-[var(--ghost-border)] rounded-[32px] text-[var(--spectral-white)] text-xs font-bold uppercase tracking-[1.17px] hover:bg-[var(--ghost-hover)] transition-colors"
                >
                  CỘNG ĐỒNG
                </button>
                {onShowOnboarding && (
                  <button
                    onClick={onShowOnboarding}
                    className="px-6 py-4 bg-[var(--ghost-surface)] border border-[var(--ghost-border)] rounded-[32px] text-[var(--spectral-white)] text-xs font-bold uppercase tracking-[1.17px] hover:bg-[var(--ghost-hover)] transition-colors"
                  >
                    TRỢ GIÚP
                  </button>
                )}
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-6 py-4 bg-[var(--ghost-surface)] border border-[var(--ghost-border)] rounded-[32px] text-[var(--spectral-white)] text-xs font-bold uppercase tracking-[1.17px] hover:bg-[var(--ghost-hover)] transition-colors"
                >
                  HỆ THỐNG
                </button>
                {onShowModelConfig && (
                  <button
                    onClick={onShowModelConfig}
                    className="px-6 py-4 bg-[var(--ghost-surface)] border border-[var(--ghost-border)] rounded-[32px] text-[var(--spectral-white)] text-xs font-bold uppercase tracking-[1.17px] hover:bg-[var(--ghost-hover)] transition-colors"
                  >
                    CẤU HÌNH MODEL
                  </button>
                )}
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Original Dark/Light Theme Layout */}
          <div className="max-w-7xl mx-auto">
            <header className="mb-16 border-b border-[var(--border-subtle)] pb-8 flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-light text-[var(--text-primary)] tracking-tight mb-2 flex items-center gap-3">
                  Kho dự án
                  <span className="text-[var(--text-muted)] text-lg">/</span>
                  <span className="text-[var(--text-muted)] text-sm font-mono tracking-widest uppercase">Projects Database</span>
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowGroupQr(true)}
                  className="group flex items-center gap-2 px-4 py-3 border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors"
                  title="Tham gia nhóm hỗ trợ"
                >
                  <span className="font-medium text-xs tracking-widest uppercase">Cộng đồng</span>
                </button>
                {onShowOnboarding && (
                  <button
                    onClick={onShowOnboarding}
                    className="group flex items-center gap-2 px-4 py-3 border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors"
                    title="Hướng dẫn nhanh"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span className="font-medium text-xs tracking-widest uppercase">Trợ giúp</span>
                  </button>
                )}
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="group flex items-center gap-2 px-4 py-3 border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="font-medium text-xs tracking-widest uppercase">Hệ thống</span>
                </button>
                <button
                  onClick={toggleTheme}
                  className="group flex items-center gap-2 px-4 py-3 border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors"
                  title={theme === 'dark' ? 'Chế độ Sáng' : theme === 'light' ? 'SpaceX' : 'Chế độ Tối'}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : theme === 'light' ? <Film className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span className="font-medium text-xs tracking-widest uppercase">{theme === 'dark' ? 'Sáng' : theme === 'light' ? 'SpaceX' : 'Tối'}</span>
                </button>
                <button
                  onClick={handleCreate}
                  className="group flex items-center gap-3 px-6 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-bold text-xs tracking-widest uppercase">Tạo dự án mới</span>
                </button>
              </div>
            </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-[var(--text-muted)] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Create New Card */}
            <div 
              onClick={handleCreate}
              className="group cursor-pointer border border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-primary)] flex flex-col items-center justify-center min-h-[280px] transition-all"
            >
              <div className="w-12 h-12 border border-[var(--border-secondary)] flex items-center justify-center mb-6 group-hover:bg-[var(--bg-hover)] transition-colors">
                <Plus className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]" />
              </div>
              <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest group-hover:text-[var(--text-secondary)]">Create New Project</span>
            </div>

            {/* Project List */}
            {projects.map((proj) => (
              <div 
                key={proj.id}
                onClick={() => navigate(`/project/${proj.id}`)}
                className="group bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] p-0 flex flex-col cursor-pointer transition-all relative overflow-hidden h-[280px]"
              >
                  {deleteConfirmId === proj.id && (
                    <div className="absolute inset-0 z-20 bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="w-10 h-10 bg-[var(--error-hover-bg)] flex items-center justify-center rounded-full">
                           <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-[var(--text-primary)] font-bold text-xs uppercase tracking-widest">XÁC NHẬN XÓA DỰ ÁN?</p>
                            <p className="text-[var(--text-tertiary)] text-[10px] font-mono">Dữ liệu kịch bản và nhân vật sẽ bị xóa vĩnh viễn</p>
                        </div>
                        <div className="flex gap-2 w-full pt-2">
                            <button onClick={cancelDelete} className="flex-1 py-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-[10px] font-bold uppercase tracking-wider transition-colors border border-[var(--border-primary)]">Hủy</button>
                            <button onClick={(e) => confirmDelete(e, proj.id)} className="flex-1 py-3 bg-[var(--error-hover-bg)] text-[var(--error-text)] text-[10px] font-bold uppercase tracking-wider transition-colors border border-[var(--error-border)]">Xóa vĩnh viễn</button>
                        </div>
                    </div>
                  )}

                  <div className="flex-1 p-6 relative flex flex-col">
                     <button onClick={(e) => requestDelete(e, proj.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--error-text)] transition-all rounded-sm z-10" title="Xóa dự án">
                        <Trash2 className="w-4 h-4" />
                    </button>
                     <div className="flex-1">
                        <Folder className="w-8 h-8 text-[var(--text-muted)] mb-6 group-hover:text-[var(--text-tertiary)] transition-colors" />
                        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2 line-clamp-1 tracking-wide">{proj.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-[9px] font-mono text-[var(--text-tertiary)] border border-[var(--border-primary)] px-1.5 py-0.5 uppercase tracking-wider">
                              <Users className="w-3 h-3 inline mr-1" />{proj.characterLibrary?.length || 0} Nhân vật
                            </span>
                            <span className="text-[9px] font-mono text-[var(--text-tertiary)] border border-[var(--border-primary)] px-1.5 py-0.5 uppercase tracking-wider">
                              <Film className="w-3 h-3 inline mr-1" />Nhiều tập
                            </span>
                        </div>
                        {proj.description && (
                            <p className="text-[10px] text-[var(--text-muted)] line-clamp-2 leading-relaxed font-mono border-l border-[var(--border-primary)] pl-2">{proj.description}</p>
                        )}
                     </div>
                  </div>

                  <div className="px-6 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-sunken)]">
                    <div className="flex items-center gap-2 text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        {formatDate(proj.lastModified)}
                    </div>
                    <ChevronRight className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </>
      )}

      {/* Group QR Modal */}
      {showGroupQr && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${
          isSpaceX ? 'bg-[var(--space-black)]/95 backdrop-blur-sm' : 'bg-[var(--bg-base)]/70'
        }`} onClick={() => setShowGroupQr(false)}>
          <div
            className={`relative w-full max-w-md p-6 md:p-8 ${
              isSpaceX
                ? 'border border-[var(--ghost-border)]'
                : 'bg-[var(--bg-primary)] border border-[var(--border-primary)]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowGroupQr(false)}
              className={`absolute right-4 top-4 p-2 transition-colors ${
                isSpaceX
                  ? 'text-[var(--text-muted)] hover:text-[var(--spectral-white)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${
          isSpaceX ? 'bg-[var(--space-black)]/95 backdrop-blur-sm' : 'bg-[var(--bg-base)]/70'
        }`} onClick={() => setShowSettingsModal(false)}>
          <div
            className={`relative w-full max-w-xl p-6 md:p-8 ${
              isSpaceX
                ? 'border border-[var(--ghost-border)]'
                : 'bg-[var(--bg-primary)] border border-[var(--border-primary)]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowSettingsModal(false)}
              className={`absolute right-4 top-4 p-2 transition-colors ${
                isSpaceX
                  ? 'text-[var(--text-muted)] hover:text-[var(--spectral-white)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
            <div className={`flex items-end justify-between pb-4 mb-6 ${
              isSpaceX ? 'border-b border-[var(--ghost-border)]' : 'border-b border-[var(--border-subtle)]'
            }`}>
              <div>
                <h2 className={`text-lg flex items-center gap-2 ${
                  isSpaceX
                    ? 'text-[var(--spectral-white)] uppercase tracking-[0.96px]'
                    : 'text-[var(--text-primary)]'
                }`}>
                  <Settings className={`w-4 h-4 ${isSpaceX ? 'text-[var(--spectral-white)]' : 'text-[var(--accent-text)]'}`} />
                  Cấu hình hệ thống
                  <span className={`text-xs font-mono uppercase tracking-widest ${isSpaceX ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`}>Settings</span>
                </h2>
                <p className={`text-xs mt-2 ${isSpaceX ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'}`}>Quản lý cấu hình mô hình, thư viện tài nguyên và sao lưu dữ liệu</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {onShowModelConfig && (
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    onShowModelConfig();
                  }}
                  className="p-4 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-left"
                >
                  <div className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-bold">
                    <Cpu className="w-4 h-4 text-[var(--accent-text)]" />
                    Cấu hình Model
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-2">Quản lý cài đặt Model & API</div>
                </button>
              )}

              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowLibraryModal(true);
                }}
                className="p-4 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-left"
              >
                <div className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-bold">
                  <Archive className="w-4 h-4 text-[var(--accent-text)]" />
                  Thư viện tài nguyên
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-2">Quản lý nhân vật và bối cảnh dùng chung</div>
              </button>

              <button
                onClick={handleExportData}
                disabled={isDataExporting}
                className="p-4 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-bold">
                  <Database className="w-4 h-4 text-[var(--accent-text)]" />
                  Xuất dữ liệu
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-2">Sao lưu toàn bộ dự án và thư viện</div>
              </button>

              <button
                onClick={handleImportData}
                disabled={isDataImporting}
                className="p-4 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2 text-[var(--text-primary)] text-sm font-bold">
                  <Database className="w-4 h-4 text-[var(--accent-text)]" />
                  Nhập dữ liệu
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-2">Khôi phục dự án từ file sao lưu</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Library Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-base)]/70 p-6" onClick={() => setShowLibraryModal(false)}>
          <div
            className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-[var(--bg-primary)] border border-[var(--border-primary)] p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLibraryModal(false)}
              className="absolute right-4 top-4 p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-end justify-between border-b border-[var(--border-subtle)] pb-6 mb-6">
              <div>
                <h2 className="text-lg text-[var(--text-primary)] flex items-center gap-2">
                  <Archive className="w-4 h-4 text-[var(--accent-text)]" />
                  Thư viện tài nguyên
                  <span className="text-[var(--text-muted)] text-xs font-mono uppercase tracking-widest">Asset Library</span>
                </h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  Thêm nhân vật và bối cảnh vào thư viện để sử dụng cho nhiều dự án khác nhau
                </p>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-widest">
                {libraryItems.length} tài nguyên
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  placeholder="Tìm kiếm tài nguyên..."
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-secondary)]"
                />
              </div>
              <div className="min-w-[180px]">
                <select
                  value={libraryProjectFilter}
                  onChange={(e) => setLibraryProjectFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-secondary)]"
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
                    {type === 'all' ? 'TẤT CẢ' : type === 'character' ? 'NHÂN VẬT' : type === 'scene' ? 'BỐI CẢNH' : 'ĐẠO CỤ'}
                  </button>
                ))}
              </div>
            </div>

            {isLibraryLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 text-[var(--text-muted)] animate-spin" />
              </div>
            ) : filteredLibraryItems.length === 0 ? (
              <div className="border border-dashed border-[var(--border-primary)] rounded-xl p-10 text-center text-[var(--text-muted)] text-sm">
                Chưa có tài nguyên nào. Bạn có thể thêm vào thư viện từ phần "Nhân vật & Bối cảnh" của dự án.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                      className="bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-colors rounded-xl overflow-hidden"
                    >
                      <div className="aspect-video bg-[var(--bg-elevated)]">
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
                            {item.type === 'character' ? 'NHÂN VẬT' : item.type === 'scene' ? 'BỐI CẢNH' : 'ĐẠO CỤ'}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1 line-clamp-1">
                            {(item.projectName && item.projectName.trim()) || 'Dự án chưa xác định'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAssetToUse(item)}
                            className="flex-1 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                          >
                            Dùng cho dự án
                          </button>
                          <button
                            onClick={() => handleDeleteLibraryItem(item.id)}
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
      )}

      {/* Asset Library Project Picker */}
      {assetToUse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-base)]/70 p-6" onClick={() => setAssetToUse(null)}>
          <div
            className="relative w-full max-w-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAssetToUse(null)}
              className="absolute right-4 top-4 p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-4">
              <div className="text-[var(--text-primary)] text-sm font-bold tracking-widest uppercase">Chọn dự án để sử dụng</div>
              <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                Nhập tài nguyên “{assetToUse.name}” vào dự án sau:
              </div>
              {projects.length === 0 ? (
                <div className="text-[var(--text-muted)] text-sm">Không có dự án khả dụng</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => handleUseAsset(proj.id)}
                      className="p-4 text-left border border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-deep)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <div className="text-sm text-[var(--text-primary)] font-bold line-clamp-1">{proj.title}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-1">Sửa lần cuối: {formatDate(proj.lastModified)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFileChange}
      />
    </div>
  );
};

export default Dashboard;
