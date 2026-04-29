import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Users, Film, Trash2, Edit2, Check, X, Loader2, FolderOpen, ChevronRight, MapPin, Package, Database } from 'lucide-react';
import { useProjectContext } from '../contexts/ProjectContext';
import { useAlert } from './GlobalAlert';
import { exportSeriesProjectData } from '../services/storageService';
import {
  useBackupTransfer,
  PROJECT_BACKUP_TRANSFER_MESSAGES,
  projectBackupFileName,
} from '../hooks/useBackupTransfer';

const ProjectOverview: React.FC = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { project, loading, allSeries, allEpisodes, createSeries, createEpisode, removeSeries, removeEpisode, updateProject, getEpisodesForSeries } = useProjectContext();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [newSeriesName, setNewSeriesName] = useState('');
  const [showNewSeries, setShowNewSeries] = useState(false);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const { isDataExporting, handleExportData } = useBackupTransfer({
    exporter: async () => {
      if (!project?.id) throw new Error('Dự án hiện tại không tồn tại');
      return exportSeriesProjectData(project.id);
    },
    exportFileName: (timestamp) => projectBackupFileName(project?.id || 'unknown', timestamp),
    showAlert,
    messages: PROJECT_BACKUP_TRANSFER_MESSAGES,
  });

  if (loading || !project) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <Loader2 className="w-6 h-6 text-[var(--text-muted)] animate-spin" />
      </div>
    );
  }

  const handleSaveTitle = () => {
    if (titleDraft.trim()) updateProject({ title: titleDraft.trim() });
    setEditingTitle(false);
  };

  const handleCreateSeries = async () => {
    if (!newSeriesName.trim()) return;
    const series = await createSeries(newSeriesName.trim());
    setNewSeriesName('');
    setShowNewSeries(false);
    setExpandedSeries((prev) => new Set(prev).add(series.id));
  };

  const handleCreateEpisode = async (seriesId: string) => {
    const episodes = getEpisodesForSeries(seriesId);
    await createEpisode(seriesId, `Tập ${episodes.length + 1}`);
  };

  const handleDeleteSeries = (id: string, title: string) => {
    showAlert(`Xác nhận xóa phần phim “${title}” và toàn bộ các tập bên trong? Thao tác này không thể hoàn tác.`, {
      type: 'warning',
      showCancel: true,
      onConfirm: () => removeSeries(id),
    });
  };

  const handleDeleteEpisode = (id: string, title: string) => {
    showAlert(`Xác nhận xóa tập “${title}”?`, {
      type: 'warning',
      showCancel: true,
      onConfirm: () => removeEpisode(id),
    });
  };

  const toggleSeries = (id: string) => {
    setExpandedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const getEpisodeDisplayTitle = (episodeNumber: number, title: string) => {
    const episodeTitle = (title || '').trim();
    const projectTitle = (project.title || '').trim();
    if (episodeNumber === 1 && episodeTitle && projectTitle && episodeTitle === projectTitle) {
      return `Tập ${episodeNumber}`;
    }
    return title;
  };

  const firstSeries = allSeries[0];
  const firstEpisode = firstSeries ? getEpisodesForSeries(firstSeries.id)[0] : null;
  const firstEpisodeTitle = firstEpisode ? getEpisodeDisplayTitle(firstEpisode.episodeNumber, firstEpisode.title) : 'Tập 1';
  const showNewProjectGuide = allSeries.length === 0 || allEpisodes.length <= 1;

  const handleCreateFirstSeries = () => {
    setShowNewSeries(true);
    if (!newSeriesName.trim()) {
      setNewSeriesName('Phần 1');
    }
  };

  const handleOpenFirstEpisode = () => {
    if (!firstEpisode) return;
    navigate(`/project/${project.id}/episode/${firstEpisode.id}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-secondary)] p-8 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 border-b border-[var(--border-subtle)] pb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-6 group"
          >
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Quay lại danh sách dự án
          </button>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    autoFocus
                    className="text-2xl font-light text-[var(--text-primary)] bg-transparent border-b-2 border-[var(--accent-text)] outline-none"
                  />
                  <button onClick={handleSaveTitle}>
                    <Check className="w-5 h-5 text-[var(--success)]" />
                  </button>
                  <button onClick={() => setEditingTitle(false)}>
                    <X className="w-5 h-5 text-[var(--text-muted)]" />
                  </button>
                </div>
              ) : (
                <h1
                  className="text-2xl font-light text-[var(--text-primary)] tracking-tight flex items-center gap-3 group cursor-pointer"
                  onClick={() => {
                    setTitleDraft(project.title);
                    setEditingTitle(true);
                  }}
                >
                  <FolderOpen className="w-6 h-6 text-[var(--text-muted)]" />
                  {project.title}
                  <Edit2 className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
              )}
              <p className="text-xs text-[var(--text-muted)] font-mono mt-2">Dự án tạo lúc {formatDate(project.createdAt)}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/project/${project.id}/characters?tab=character`)}
                className="flex items-center gap-2 px-5 py-3 border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors"
              >
                <Users className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Nhân vật ({project.characterLibrary.length})</span>
              </button>
              <button
                onClick={() => navigate(`/project/${project.id}/characters?tab=scene`)}
                className="flex items-center gap-2 px-5 py-3 border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Bối cảnh ({project.sceneLibrary.length})</span>
              </button>
              <button
                onClick={() => navigate(`/project/${project.id}/characters?tab=prop`)}
                className="flex items-center gap-2 px-5 py-3 border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors"
              >
                <Package className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Thư viện đạo cụ ({project.propLibrary.length})</span>
              </button>
              <button
                onClick={handleExportData}
                disabled={isDataExporting}
                className="flex items-center gap-2 px-5 py-3 border border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Database className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {isDataExporting ? 'Đang xuất...' : 'Xuất toàn bộ'}
                </span>
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[
            { label: 'Phần phim', value: allSeries.length, icon: Film },
            { label: 'Tổng số tập', value: allEpisodes.length, icon: FolderOpen },
            { label: 'Nhân vật', value: project.characterLibrary.length, icon: Users },
            { label: 'Bối cảnh', value: project.sceneLibrary.length, icon: MapPin },
            { label: 'Đạo cụ', value: project.propLibrary.length, icon: Package },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] p-5">
              <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
                <stat.icon className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className="text-2xl font-light text-[var(--text-primary)]">{stat.value}</div>
            </div>
          ))}
        </div>

        {showNewProjectGuide && (
          <section className="mb-8 border border-[var(--border-primary)] bg-[var(--bg-primary)] p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">HƯỚNG DẪN DỰ ÁN MỚI</p>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Đề xuất 3 bước để bắt đầu chế độ nhiều tập</h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-2">Bắt đầu bằng cách tạo Phần phim, sau đó thêm tập, và cuối cùng nhấn vào Tập 1 để sáng tác.</p>
              </div>

              {firstEpisode ? (
                <button
                  onClick={handleOpenFirstEpisode}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  Bắt đầu sáng tác Tập 1
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : firstSeries ? (
                <button
                  onClick={() => { void handleCreateEpisode(firstSeries.id); }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  Tạo tập đầu tiên
                  <Plus className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleCreateFirstSeries}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  Tạo phần phim đầu tiên
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="border border-[var(--border-primary)] bg-[var(--bg-sunken)] p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Bước 1</div>
                <div className="text-sm font-bold text-[var(--text-primary)] mb-1">Tạo phần phim</div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {allSeries.length === 0
                    ? 'Nhấn vào "Tạo phần phim", ví dụ "Phần 1".'
                    : `Đã tạo "${firstSeries.title}", bạn có thể tiếp tục thêm phần mới.`}
                </div>
              </div>
              <div className="border border-[var(--border-primary)] bg-[var(--bg-sunken)] p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Bước 2</div>
                <div className="text-sm font-bold text-[var(--text-primary)] mb-1">Tạo tập cho phần phim</div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {firstSeries
                    ? `Mở rộng "${firstSeries.title}" và nhấn nút + để thêm tập mới.`
                    : 'Sau khi tạo phần phim, mở rộng phần đó và nhấn + để thêm các tập phim.'}
                </div>
              </div>
              <div className="border border-[var(--border-primary)] bg-[var(--bg-sunken)] p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">Bước 3</div>
                <div className="text-sm font-bold text-[var(--text-primary)] mb-1">Bắt đầu sáng tác Tập 1</div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {firstEpisode
                    ? `Nhấn vào "${firstEpisodeTitle}" để bắt đầu viết kịch bản và sáng tác.`
                    : 'Sau khi tạo tập đầu tiên, nhấn vào tập đó để bước vào quy trình sáng tác.'}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Quản lý Phần phim</h2>
          <button
            onClick={() => setShowNewSeries(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            Tạo phần phim mới
          </button>
        </div>

        {showNewSeries && (
          <div className="mb-6 flex items-center gap-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4">
            <input
              value={newSeriesName}
              onChange={(e) => setNewSeriesName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSeries()}
              placeholder="Nhập tên phần phim, vd: 'Phần 2'"
              autoFocus
              className="flex-1 bg-transparent border-b border-[var(--border-secondary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none py-1"
            />
            <button
              onClick={handleCreateSeries}
              className="px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-xs font-bold uppercase tracking-widest"
            >
              Tạo
            </button>
            <button onClick={() => { setShowNewSeries(false); setNewSeriesName(''); }} className="px-4 py-2 text-[var(--text-muted)] text-xs">
              Hủy
            </button>
          </div>
        )}

        {allSeries.length === 0 ? (
          <div className="border border-dashed border-[var(--border-primary)] p-12 text-center text-[var(--text-muted)]">
            <Film className="w-10 h-10 mx-auto mb-4 opacity-30" />
            <p className="text-sm mb-2">Chưa có phần phim nào</p>
            <p className="text-[10px] font-mono">Nhấn "Tạo phần phim mới" để bắt đầu</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allSeries.map((series) => {
              const episodes = getEpisodesForSeries(series.id);
              const isExpanded = expandedSeries.has(series.id);
              return (
                <div key={series.id} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] overflow-hidden">
                  <div
                    className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                    onClick={() => toggleSeries(series.id)}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      <Film className="w-5 h-5 text-[var(--text-tertiary)]" />
                      <span className="text-sm font-bold text-[var(--text-primary)]">{series.title}</span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">{episodes.length} phần</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCreateEpisode(series.id);
                        }}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        title="Thêm tập mới"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteSeries(series.id, series.title);
                        }}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--bg-hover)] transition-colors"
                        title="Xóa tập"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[var(--border-subtle)]">
                      {episodes.length === 0 ? (
                        <div className="px-6 py-8 text-center text-[var(--text-muted)] text-xs">
                          Chưa có tập phim
                          <button onClick={() => handleCreateEpisode(series.id)} className="ml-2 text-[var(--accent-text)] hover:underline">
                            Tạo tập đầu tiên
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-[var(--border-subtle)]">
                          {episodes.map((episode) => (
                            <div key={episode.id} className="flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-secondary)] transition-colors group">
                              <button onClick={() => navigate(`/project/${project.id}/episode/${episode.id}`)} className="flex items-center gap-3 flex-1 text-left">
                                <span className="w-8 h-8 flex items-center justify-center bg-[var(--bg-elevated)] text-[10px] font-mono text-[var(--text-tertiary)] rounded">
                                  {episode.episodeNumber}
                                </span>
                                <div>
                                  <div className="text-sm text-[var(--text-primary)]">{getEpisodeDisplayTitle(episode.episodeNumber, episode.title)}</div>
                                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                                    {episode.stage === 'script'
                                      ? 'Kịch bản'
                                      : episode.stage === 'assets'
                                      ? 'Sinh tài nguyên'
                                      : episode.stage === 'director'
                                      ? 'Bàn đạo diễn'
                                      : 'Xuất phim'}
                                    {' · '}
                                    {formatDate(episode.lastModified)}
                                  </div>
                                </div>
                              </button>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleDeleteEpisode(episode.id, getEpisodeDisplayTitle(episode.episodeNumber, episode.title))}
                                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--error-text)] transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-sunken)]">
                        <button
                          onClick={() => handleCreateEpisode(series.id)}
                          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Thêm tập mới
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectOverview;
