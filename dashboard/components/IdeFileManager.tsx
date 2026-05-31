import React, { useState, useCallback, useEffect, useRef } from 'react';
import FileTreeSidebar from './FileTreeSidebar';
import FileEditorTabs from './FileEditorTabs';
import { IdeTab, IdeFile } from './ide-types';
import './ide-filemanager.css';

const IdeFileManager: React.FC = () => {
    const [tabs, setTabs] = useState<IdeTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [sidebarWidth, setSidebarWidth] = useState(240);
    const [isResizing, setIsResizing] = useState(false);
    const [currentDirectory, setCurrentDirectory] = useState<string>('/');
    const containerRef = useRef<HTMLDivElement>(null);
    const resizerRef = useRef<HTMLDivElement>(null);

    const startResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        if (!isResizing) return;

        const onMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const newWidth = Math.max(160, Math.min(480, e.clientX - rect.left));
            setSidebarWidth(newWidth);
        };

        const onMouseUp = () => setIsResizing(false);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isResizing]);

    const openFile = useCallback((file: IdeFile) => {
        setTabs(prev => {
            const existing = prev.find(t => t.path === file.path);
            if (existing) {
                setActiveTabId(existing.id);
                return prev;
            }
            const newTab: IdeTab = {
                id: `tab-${Date.now()}-${Math.random()}`,
                name: file.name,
                path: file.path,
                content: file.content ?? null,
                isDirty: false,
                isLoading: file.content === undefined,
            };
            setActiveTabId(newTab.id);
            return [...prev, newTab];
        });
    }, []);

    const closeTab = useCallback((tabId: string) => {
        setTabs(prev => {
            const idx = prev.findIndex(t => t.id === tabId);
            const next = prev.filter(t => t.id !== tabId);
            if (activeTabId === tabId) {
                const newActive = next[Math.max(0, idx - 1)];
                setActiveTabId(newActive?.id ?? null);
            }
            return next;
        });
    }, [activeTabId]);

    const updateTabContent = useCallback((tabId: string, content: string) => {
        setTabs(prev =>
            prev.map(t => t.id === tabId ? { ...t, content, isDirty: true } : t)
        );
    }, []);

    const markTabSaved = useCallback((tabId: string) => {
        setTabs(prev =>
            prev.map(t => t.id === tabId ? { ...t, isDirty: false } : t)
        );
    }, []);

    const setTabContent = useCallback((tabId: string, content: string) => {
        setTabs(prev =>
            prev.map(t => t.id === tabId ? { ...t, content, isLoading: false } : t)
        );
    }, []);

    const activeTab = tabs.find(t => t.id === activeTabId) ?? null;

    return (
        <div
            ref={containerRef}
            className={`ide-container${isResizing ? ' ide-container--resizing' : ''}`}
            style={{ marginTop: '20px' }}
        >
            <aside className="ide-sidebar" style={{ width: sidebarWidth }}>
                <FileTreeSidebar
                    currentDirectory={currentDirectory}
                    onDirectoryChange={setCurrentDirectory}
                    onOpenFile={openFile}
                    activeFilePath={activeTab?.path ?? null}
                />
            </aside>

            <div
                ref={resizerRef}
                className="ide-resizer"
                onMouseDown={startResize}
                title="Redimensionner"
            />

            <main className="ide-main">
                <FileEditorTabs
                    tabs={tabs}
                    activeTabId={activeTabId}
                    onSelectTab={setActiveTabId}
                    onCloseTab={closeTab}
                    onUpdateContent={updateTabContent}
                    onSaved={markTabSaved}
                    onTabContentLoaded={setTabContent}
                />
            </main>
        </div>
    );
};

export default IdeFileManager;
