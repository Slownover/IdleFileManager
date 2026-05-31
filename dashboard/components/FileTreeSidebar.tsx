import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IdeFile, IdeDirectoryEntry, IdeTreeEntry, getFileIcon } from './ide-types';
import http from '@/api/http';
import { useParams } from 'react-router-dom';

interface Props {
    currentDirectory: string;
    onDirectoryChange: (dir: string) => void;
    onOpenFile: (file: IdeFile) => void;
    activeFilePath: string | null;
}

const FileTreeSidebar: React.FC<Props> = ({
    currentDirectory,
    onDirectoryChange,
    onOpenFile,
    activeFilePath,
}) => {
    const { id: serverId } = useParams<{ id: string }>();
    const [tree, setTree] = useState<IdeTreeEntry[]>([]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set(['/']));
    const [loading, setLoading] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: IdeTreeEntry } | null>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const fetchDirectory = useCallback(async (path: string): Promise<IdeTreeEntry[]> => {
        try {
            const { data } = await http.get(
                `/api/client/servers/${serverId}/files/list`,
                { params: { directory: path } }
            );
            return (data.data ?? []).map((f: any): IdeTreeEntry => ({
                name: f.attributes.name,
                path: path === '/' ? `/${f.attributes.name}` : `${path}/${f.attributes.name}`,
                isDirectory: f.attributes.is_file === false,
                size: f.attributes.size,
                modifiedAt: f.attributes.modified_at,
                ...(f.attributes.is_file === false ? { children: undefined, isExpanded: false } : {}),
            }));
        } catch (err) {
            console.error('[IDE File Manager] Failed to load directory:', path, err);
            return [];
        }
    }, [serverId]);

    useEffect(() => {
        setLoading(prev => new Set(prev).add('/'));
        fetchDirectory('/').then(entries => {
            setTree(entries);
            setLoading(prev => { const s = new Set(prev); s.delete('/'); return s; });
        });
    }, [fetchDirectory]);

    const toggleDir = useCallback(async (entry: IdeDirectoryEntry) => {
        const isOpen = expanded.has(entry.path);
        if (isOpen) {
            setExpanded(prev => { const s = new Set(prev); s.delete(entry.path); return s; });
            return;
        }

        setExpanded(prev => new Set(prev).add(entry.path));

        if (!entry.children) {
            setLoading(prev => new Set(prev).add(entry.path));
            const children = await fetchDirectory(entry.path);

            const injectChildren = (nodes: IdeTreeEntry[]): IdeTreeEntry[] =>
                nodes.map(n => {
                    if (!n.isDirectory) return n;
                    if (n.path === entry.path) return { ...n, children };
                    if (n.isDirectory && n.children) return { ...n, children: injectChildren(n.children) };
                    return n;
                });

            setTree(prev => injectChildren(prev));
            setLoading(prev => { const s = new Set(prev); s.delete(entry.path); return s; });
        }
    }, [expanded, fetchDirectory]);

    const openFile = useCallback(async (file: IdeFile) => {
        onOpenFile({ ...file, content: undefined });
    }, [onOpenFile]);

    useEffect(() => {
        if (!contextMenu) return;
        const handler = () => setContextMenu(null);
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, [contextMenu]);

    const flattenTree = useCallback((nodes: IdeTreeEntry[], depth = 0): Array<IdeTreeEntry & { depth: number }> => {
        const result: Array<IdeTreeEntry & { depth: number }> = [];
        for (const node of nodes) {
            result.push({ ...node, depth });
            if (node.isDirectory && expanded.has(node.path) && node.children) {
                result.push(...flattenTree(node.children, depth + 1));
            }
        }
        return result;
    }, [expanded]);

    const flatNodes = flattenTree(tree).filter(n =>
        search === '' || n.name.toLowerCase().includes(search.toLowerCase())
    );

    const breadcrumbs = currentDirectory
        .split('/')
        .filter(Boolean)
        .reduce<{ label: string; path: string }[]>((acc, seg, i, arr) => {
            const path = '/' + arr.slice(0, i + 1).join('/');
            return [...acc, { label: seg, path }];
        }, [{ label: '~', path: '/' }]);

    return (
        <div ref={sidebarRef} className="ide-sidebar__inner">
            <div className="ide-sidebar__header">
                <span className="ide-sidebar__title">EXPLORER</span>
            </div>

            <div className="ide-sidebar__search-wrap">
                <svg className="ide-sidebar__search-icon" viewBox="0 0 20 20" fill="none">
                    <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                    className="ide-sidebar__search"
                    type="text"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                {search && (
                    <button className="ide-sidebar__search-clear" onClick={() => setSearch('')}>✕</button>
                )}
            </div>

            <div className="ide-sidebar__breadcrumbs">
                {breadcrumbs.map((bc, i) => (
                    <React.Fragment key={bc.path}>
                        <button
                            className="ide-sidebar__bc-seg"
                            onClick={() => onDirectoryChange(bc.path)}
                        >
                            {bc.label}
                        </button>
                        {i < breadcrumbs.length - 1 && (
                            <span className="ide-sidebar__bc-sep">/</span>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="ide-sidebar__tree">
                {loading.has('/') && flatNodes.length === 0 ? (
                    <div className="ide-sidebar__empty">
                        <span className="ide-spinner" />
                        Chargement…
                    </div>
                ) : flatNodes.length === 0 ? (
                    <div className="ide-sidebar__empty">Dossier vide</div>
                ) : (
                    flatNodes.map(node => (
                        <div
                            key={node.path}
                            className={[
                                'ide-tree-row',
                                node.isDirectory ? 'ide-tree-row--dir' : 'ide-tree-row--file',
                                activeFilePath === node.path ? 'ide-tree-row--active' : '',
                            ].filter(Boolean).join(' ')}
                            style={{ paddingLeft: `${8 + node.depth * 16}px` }}
                            onClick={() => {
                                if (node.isDirectory) {
                                    toggleDir(node as IdeDirectoryEntry);
                                    onDirectoryChange(node.path);
                                } else {
                                    openFile(node as IdeFile);
                                }
                            }}
                            onContextMenu={e => {
                                e.preventDefault();
                                setContextMenu({ x: e.clientX, y: e.clientY, entry: node });
                            }}
                            title={node.path}
                        >
                            {node.isDirectory && (
                                <span className={`ide-tree-chevron${expanded.has(node.path) ? ' ide-tree-chevron--open' : ''}`}>
                                    ›
                                </span>
                            )}

                            {loading.has(node.path) ? (
                                <span className="ide-spinner ide-spinner--sm" />
                            ) : (
                                <span className="ide-tree-icon">{getFileIcon(node)}</span>
                            )}

                            <span className="ide-tree-name">{node.name}</span>

                            {!node.isDirectory && (node as IdeFile).size !== undefined && (
                                <span className="ide-tree-size">
                                    {formatBytesShort((node as IdeFile).size!)}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>

            {contextMenu && (
                <div
                    className="ide-context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}
                >
                    {!contextMenu.entry.isDirectory && (
                        <button
                            className="ide-context-menu__item"
                            onClick={() => { openFile(contextMenu.entry as IdeFile); setContextMenu(null); }}
                        >
                            Ouvrir
                        </button>
                    )}
                    <button
                        className="ide-context-menu__item"
                        onClick={() => {
                            navigator.clipboard.writeText(contextMenu.entry.path);
                            setContextMenu(null);
                        }}
                    >
                        Copier le chemin
                    </button>
                </div>
            )}
        </div>
    );
};

function formatBytesShort(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

export default FileTreeSidebar;
