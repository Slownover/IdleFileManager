import React, { useState, useEffect } from 'react';
import { ServerContext } from '@/state/server';
import getDirectory from '@/api/server/files/getDirectory';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import FileTreeSidebar from './FileTreeSidebar';
import FileEditorTabs from './FileEditorTabs';
import { IdeFile, IdeTab } from './ide-types';
import './ide-filemanager.css';
export default function IdeFileManager() {
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const [currentPath, setCurrentPath] = useState('/');
    const [files, setFiles] = useState<IdeFile[]>([]);
    const [tabs, setTabs] = useState<IdeTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [fileContents, setFileContents] = useState<Record<string, string>>({});
    useEffect(() => {
        getDirectory(uuid, currentPath).then(data => {
            const formatted = data.map(f => ({
                name: f.name, path: `${currentPath === '/' ? '' : currentPath}/${f.name}`,
                isDirectory: f.isFile === false, isSymlink: f.isSymlink, size: f.size, mode: f.mode
            }));
            setFiles(formatted.sort((a, b) => a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : a.isDirectory ? -1 : 1));
        });
    }, [uuid, currentPath]);
    const handleOpenFile = async (file: IdeFile) => {
        if (file.isDirectory) { setCurrentPath(file.path); return; }
        const existingTab = tabs.find(t => t.path === file.path);
        if (existingTab) { setActiveTabId(existingTab.id); return; }
        const content = await getFileContents(uuid, file.path);
        const newTab: IdeTab = { id: file.path, path: file.path, name: file.name, isDirty: false };
        setFileContents(prev => ({ ...prev, [file.path]: content }));
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
    };
    const handleCloseTab = (tabId: string) => {
        setTabs(prev => prev.filter(t => t.id !== tabId));
        if (activeTabId === tabId) setActiveTabId(tabs.length > 1 ? tabs[0].id : null);
    };
    const handleSaveFile = async (path: string, content: string) => {
        await saveFileContents(uuid, path, content);
        setTabs(prev => prev.map(t => t.id === path ? { ...t, isDirty: false } : t));
    };
    return (
        <div className="ide-container">
            <FileTreeSidebar files={files} currentPath={currentPath} onNavigateUp={() => {
                const parts = currentPath.split('/'); parts.pop();
                setCurrentPath(parts.join('/') || '/');
            }} onOpenFile={handleOpenFile} />
            <FileEditorTabs tabs={tabs} activeTabId={activeTabId} fileContents={fileContents}
                onTabSelect={setActiveTabId} onTabClose={handleCloseTab} 
                onContentChange={(path: string, c: string) => {
                    setFileContents(prev => ({ ...prev, [path]: c }));
                    setTabs(prev => prev.map(t => t.id === path ? { ...t, isDirty: true } : t));
                }} onSave={handleSaveFile} />
        </div>
    );
}
