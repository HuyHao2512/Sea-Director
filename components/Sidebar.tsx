import React from 'react';
import { FileText, Users, Clapperboard, Film, ChevronLeft, ListTree, HelpCircle, Cpu, Sun, Moon, Loader2, FolderOpen, BookOpen, Globe, Palette } from 'lucide-react';
import logoImg from '../logo.png';
import { useTheme } from '../contexts/ThemeContext';
import { USER_MANUAL_URL, OFFICIAL_WEBSITE_URL, CREATIVE_HOME_URL, COPYRIGHT_TEXT } from '../constants/links';

interface SidebarProps {
  currentStage: string;
  setStage: (stage: 'script' | 'assets' | 'director' | 'export' | 'prompts') => void;
  onExit: () => void;
  projectName?: string;
  onShowOnboarding?: () => void;
  onShowModelConfig?: () => void;
  isNavigationLocked?: boolean;
  episodeInfo?: { projectId: string; projectTitle: string; episodeTitle: string };
  onGoToProject?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentStage, setStage, onExit, projectName, onShowOnboarding, onShowModelConfig, isNavigationLocked, episodeInfo, onGoToProject }) => {
  const { theme, toggleTheme } = useTheme();
  const navItems = [
    { id: 'script', label: 'Kịch bản & Câu chuyện', icon: FileText, sub: 'Giai đoạn 01' },
    { id: 'assets', label: 'Nhân vật & Bối cảnh', icon: Users, sub: 'Giai đoạn 02' },
    { id: 'director', label: 'Bàn làm việc Đạo diễn', icon: Clapperboard, sub: 'Giai đoạn 03' },
    { id: 'export', label: 'Hoàn thiện & Xuất phim', icon: Film, sub: 'Giai đoạn 04' },
    { id: 'prompts', label: 'Quản lý Prompt', icon: ListTree, sub: 'Nâng cao' },
  ];

  const isSpaceX = theme === 'spacex';

  return (
    <aside className={`w-72 h-screen fixed left-0 top-0 flex flex-col z-50 select-none transition-all ${
      isSpaceX
        ? 'bg-[var(--space-black)]/80 backdrop-blur-md border-r border-[var(--ghost-border)]'
        : 'bg-[var(--bg-base)] border-r border-[var(--border-primary)]'
    }`}>
      <div className={`p-6 border-b ${isSpaceX ? 'border-[var(--ghost-border)]' : 'border-[var(--border-subtle)]'}`}>
        <a href="https://tree456.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 mb-6 group cursor-pointer">
          <img src={logoImg} alt="Logo" className="w-8 h-8 flex-shrink-0 transition-transform group-hover:scale-110" />
          <div className="overflow-hidden">
            <h1 className={`text-sm font-bold tracking-wider group-hover:transition-colors ${
              isSpaceX
                ? 'text-[var(--spectral-white)] uppercase tracking-[1.17px]'
                : 'text-[var(--text-primary)] group-hover:text-[var(--text-secondary)]'
            }`}>AI DIRECTOR</h1>
            <p className={`text-[10px] tracking-widest group-hover:transition-colors ${
              isSpaceX
                ? 'text-[var(--text-muted)] uppercase tracking-[1px]'
                : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'
            }`}>PHIÊN BẢN PRO</p>
          </div>
        </a>
        <button
          onClick={onExit}
          className={`flex items-center gap-2 transition-colors text-xs uppercase tracking-wide group ${
            isNavigationLocked
              ? 'text-[var(--text-muted)] opacity-50 cursor-not-allowed'
              : isSpaceX
                ? 'text-[var(--text-secondary)] hover:text-[var(--spectral-white)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
          }`}
          title={isNavigationLocked ? 'Đang tạo nội dung, thoát trang sẽ làm mất dữ liệu' : undefined}
        >
          <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          {episodeInfo ? 'Quay lại tổng quan' : 'Quay lại danh sách'}
        </button>
      </div>

      <div className={`px-6 py-4 border-b ${isSpaceX ? 'border-[var(--ghost-border)]' : 'border-[var(--border-subtle)]'}`}>
        {episodeInfo ? (
          <>
            <div className={`text-[10px] uppercase tracking-widest mb-1 ${isSpaceX ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`}>Dự án hiện tại</div>
            <button onClick={onGoToProject} className={`text-xs hover:underline truncate block mb-2 text-left ${isSpaceX ? 'text-[var(--spectral-white)]' : 'text-[var(--accent-text)]'}`}>
              <FolderOpen className="w-3 h-3 inline mr-1" />{episodeInfo.projectTitle}
            </button>
            <div className={`text-[10px] uppercase tracking-widest mb-1 ${isSpaceX ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`}>Tập hiện tại</div>
            <div className={`text-sm font-medium truncate font-mono ${isSpaceX ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>{episodeInfo.episodeTitle}</div>
          </>
        ) : (
          <>
            <div className={`text-[10px] uppercase tracking-widest mb-1 ${isSpaceX ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`}>Dự án hiện tại</div>
            <div className={`text-sm font-medium truncate font-mono ${isSpaceX ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'}`}>{projectName || 'Dự án chưa đặt tên'}</div>
          </>
        )}
      </div>

      {isNavigationLocked && (
        <div className={`mx-4 mt-4 px-3 py-2.5 rounded-lg border ${isSpaceX ? 'bg-[var(--warning)]/10 border-[var(--warning)]/30' : 'bg-[var(--warning)]/10 border-[var(--warning)]/30'}`}>
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-[var(--warning)] animate-spin flex-shrink-0" />
            <span className="text-[10px] font-medium text-[var(--warning)] uppercase tracking-wide">Đang tạo nội dung</span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">Chuyển trang sẽ làm mất dữ liệu</p>
        </div>
      )}

      <nav className="flex-1 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = currentStage === item.id;
          const isLocked = isNavigationLocked && !isActive;
          return (
            <button key={item.id} onClick={() => setStage(item.id as any)}
              className={`w-full flex items-center justify-between px-6 py-4 transition-all duration-200 group relative border-l-2 ${
                isActive
                  ? isSpaceX
                    ? 'border-[var(--spectral-white)] bg-[var(--nav-active-bg)] text-[var(--spectral-white)]'
                    : 'border-[var(--text-primary)] bg-[var(--nav-active-bg)] text-[var(--text-primary)]'
                  : isLocked
                    ? 'border-transparent text-[var(--text-muted)] opacity-50 cursor-not-allowed'
                    : isSpaceX
                      ? 'border-transparent text-[var(--text-secondary)] hover:text-[var(--spectral-white)] hover:bg-[var(--nav-hover-bg)]'
                      : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--nav-hover-bg)]'
              }`}
              title={isLocked ? 'Đang có tác vụ chạy, chuyển trang sẽ làm mất dữ liệu' : undefined}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 ${isActive ? (isSpaceX ? 'text-[var(--spectral-white)]' : 'text-[var(--text-primary)]') : isLocked ? 'text-[var(--text-muted)]' : isSpaceX ? 'text-[var(--text-muted)] group-hover:text-[var(--spectral-white)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`} />
                <span className={`font-medium text-xs tracking-wider uppercase ${isSpaceX ? 'tracking-[1.17px]' : ''}`}>{item.label}</span>
              </div>
              <span className={`text-[10px] font-mono ${isActive ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-muted)]'}`}>{item.sub}</span>
            </button>
          );
        })}
      </nav>

      <div className={`p-6 border-t space-y-4 ${isSpaceX ? 'border-[var(--ghost-border)]' : 'border-[var(--border-subtle)]'}`}>
        <button onClick={toggleTheme} className={`w-full flex items-center justify-between cursor-pointer transition-colors font-mono text-[10px] uppercase tracking-widest ${
          isSpaceX
            ? 'text-[var(--text-muted)] hover:text-[var(--spectral-white)]'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`} title={theme === 'dark' ? 'Chế độ Sáng' : theme === 'light' ? 'Chế độ SpaceX' : 'Chế độ Tối'}>
          <span>{theme === 'dark' ? 'GIAO DIỆN SÁNG' : theme === 'light' ? 'SPACEX' : 'GIAO DIỆN TỐI'}</span>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : theme === 'light' ? <Palette className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        {onShowOnboarding && (
          <button onClick={onShowOnboarding} className={`w-full flex items-center justify-between cursor-pointer transition-colors font-mono text-[10px] uppercase tracking-widest ${
            isSpaceX
              ? 'text-[var(--text-muted)] hover:text-[var(--spectral-white)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}>
            <span>Hướng dẫn nhanh</span>
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
        <a
          href={USER_MANUAL_URL}
          target="_blank"
          rel="noreferrer"
          className={`w-full flex items-center justify-between transition-colors font-mono text-[10px] uppercase tracking-widest ${
            isSpaceX
              ? 'text-[var(--text-muted)] hover:text-[var(--spectral-white)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>Sổ tay sử dụng</span>
          <BookOpen className="w-4 h-4" />
        </a>
        {onShowModelConfig && (
          <button onClick={onShowModelConfig} className={`w-full flex items-center justify-between cursor-pointer transition-colors font-mono text-[10px] uppercase tracking-widest ${
            isSpaceX
              ? 'text-[var(--text-muted)] hover:text-[var(--spectral-white)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}>
            <span>Cấu hình Model</span>
            <Cpu className="w-4 h-4" />
          </button>
        )}
        <div className="flex gap-3 pt-2">
          <a href={OFFICIAL_WEBSITE_URL} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1.5 transition-colors font-mono text-[10px] tracking-wide ${
              isSpaceX
                ? 'text-[var(--text-muted)] hover:text-[var(--spectral-white)]'
                : 'text-[var(--text-muted)] hover:text-[var(--accent-text)]'
            }`}
            title="Trang chủ TreeIntelligence"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </a>
          <span className={isSpaceX ? 'text-[var(--ghost-border)]' : 'text-[var(--border-secondary)]'}>|</span>
          <a href={CREATIVE_HOME_URL} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1.5 transition-colors font-mono text-[10px] tracking-wide ${
              isSpaceX
                ? 'text-[var(--text-muted)] hover:text-[var(--spectral-white)]'
                : 'text-[var(--text-muted)] hover:text-[var(--accent-text)]'
            }`}
            title="Trang cá nhân AI Director"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Sáng tạo</span>
          </a>
        </div>
        <div className={`text-[9px] font-mono tracking-wide opacity-60 pt-1 ${isSpaceX ? 'text-[var(--text-muted)]' : 'text-[var(--text-muted)]'}`}>
          {COPYRIGHT_TEXT}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
