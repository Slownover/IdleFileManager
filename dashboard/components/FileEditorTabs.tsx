import React, { useEffect, useRef, useCallback, useState } from 'react';
import { IdeTab, getLanguage } from './ide-types';
import http from '@/api/http';
import { useParams } from 'react-router-dom';

interface Props {
    tabs: IdeTab[];
    activeTabId: string | null;
    onSelectTab: (id: string) => void;
    onCloseTab: (id: string) => void;
    onUpdateContent: (id: string, content: string) => void;
    onSaved: (id: string) => void;
    onTabContentLoaded: (id: string, content: string) => void;
}

const FileEditorTabs: React.FC<Props> = ({
    tabs,
    activeTabId,
    onSelectTab,
    onCloseTab,
    onUpdateContent,
    onSaved,
    onTabContentLoaded,
}) => {
    const { id: serverId } = useParams<{ id: string }>();
    const tabBarRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const activeTab = tabs.find(t => t.id === activeTabId) ?? null;

    useEffect(() => {
        setSaveStatus('idle');
    }, [activeTabId]);

    useEffect(() => {
        if (!activeTab || !activeTab.isLoading) return;

        http.get(`/api/client/servers/${serverId}/files/contents`, {
            params: { file: activeTab.path },
            responseType: 'text',
            transformResponse: [(d) => d],
        }).then(({ data }) => {
            onTabContentLoaded(activeTab.id, data as unknown as string);
        }).catch(err => {
            console.error('[IDE File Manager] Failed to load file content:', err);
            onTabContentLoaded(activeTab.id, `// Error loading file: ${activeTab.path}`);
        });
    }, [activeTab?.id, activeTab?.isLoading]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (activeTab && !isSaving) saveFile();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activeTab, isSaving]);

    const saveFile = useCallback(async () => {
        if (!activeTab || activeTab.content === null) return;
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            await http.post(`/api/client/servers/${serverId}/files/write`, activeTab.content, {
                params: { file: activeTab.path },
                headers: { 'Content-Type': 'text/plain' },
            });
            onSaved(activeTab.id);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 5000);
            console.error('[IDE File Manager] Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    }, [activeTab, serverId, onSaved]);

    const handleTabMouseDown = (e: React.MouseEvent, tabId: string) => {
        if (e.button === 1) {
            e.preventDefault();
            onCloseTab(tabId);
        }
    };

    const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const val = ta.value;
            const newVal = val.substring(0, start) + '    ' + val.substring(end);
            onUpdateContent(activeTab!.id, newVal);
            requestAnimationFrame(() => {
                ta.selectionStart = ta.selectionEnd = start + 4;
            });
        }
    };

    const lang = activeTab ? getLanguage(activeTab.name) : 'plaintext';

    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const handleCursorMove = () => {
        const ta = editorRef.current;
        if (!ta) return;
        const text = ta.value.substring(0, ta.selectionStart);
        const lines = text.split('\n');
        setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 });
    };

    const lineCount = activeTab?.content?.split('\n').length ?? 0;

    return (
        <div className="ide-editor-panel">
            {tabs.length > 0 ? (
                <div ref={tabBarRef} className="ide-tabbar">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={[
                                'ide-tab',
                                tab.id === activeTabId ? 'ide-tab--active' : '',
                                tab.isDirty ? 'ide-tab--dirty' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => onSelectTab(tab.id)}
                            onMouseDown={e => handleTabMouseDown(e, tab.id)}
                            title={tab.path}
                        >
                            <span className="ide-tab__name">{tab.name}</span>
                            {tab.isDirty && <span className="ide-tab__dot" title="Non sauvegardé" />}
                            <button
                                className="ide-tab__close"
                                onClick={e => { e.stopPropagation(); onCloseTab(tab.id); }}
                                title="Fermer"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="ide-tabbar ide-tabbar--empty">
                    <span className="ide-tabbar__hint">
                        Ouvrez un fichier depuis l'arborescence
                    </span>
                </div>
            )}

            <div className="ide-editor-area">
                {activeTab ? (
                    activeTab.isLoading || activeTab.content === null ? (
                        <div className="ide-editor-loading">
                            <span className="ide-spinner" />
                            <span>Chargement de {activeTab.name}…</span>
                        </div>
                    ) : (
                        <>
                            <div className="ide-line-numbers" aria-hidden="true">
                                {activeTab.content.split('\n').map((_, i) => (
                                    <div key={i} className="ide-line-number">{i + 1}</div>
                                ))}
                            </div>

                            <textarea
                                ref={editorRef}
                                className="ide-editor"
                                value={activeTab.content}
                                onChange={e => onUpdateContent(activeTab.id, e.target.value)}
                                onKeyDown={handleEditorKeyDown}
                                onClick={handleCursorMove}
                                onKeyUp={handleCursorMove}
                                spellCheck={false}
                                autoCapitalize="off"
                                autoComplete="off"
                                autoCorrect="off"
                            />
                        </>
                    )
                ) : (
                    <div className="ide-editor-welcome">
                        <div className="ide-editor-welcome__inner">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="ide-editor-welcome__icon">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                                <path d="M7 8h10M7 12h6M7 16h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                            <p className="ide-editor-welcome__title">Aucun fichier ouvert</p>
                            <p className="ide-editor-welcome__sub">Cliquez sur un fichier dans l'arborescence pour l'ouvrir.</p>
                        </div>
                    </div>
                )}
            </div>

            {activeTab && (
                <div className="ide-statusbar">
                    <span className="ide-statusbar__path">{activeTab.path}</span>
                    <div className="ide-statusbar__right">
                        {saveStatus === 'success' && <span style={{ color: '#10b981', marginRight: '8px', fontSize: '11px' }}>✓ Sauvegardé</span>}
                        {saveStatus === 'error' && <span style={{ color: '#ef4444', marginRight: '8px', fontSize: '11px' }}>✗ Erreur</span>}
                        {activeTab.isDirty && (
                            <button
                                className="ide-statusbar__save-btn"
                                onClick={saveFile}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Sauvegarde…' : '💾 Sauvegarder (Ctrl+S)'}
                            </button>
                        )}
                        <span className="ide-statusbar__lang">{lang}</span>
                        <span className="ide-statusbar__lines">
                            {lineCount} ligne{lineCount !== 1 ? 's' : ''}
                        </span>
                        <span className="ide-statusbar__cursor">
                            Ln {cursorPos.line}, Col {cursorPos.col}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileEditorTabs;
