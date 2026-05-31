import React from 'react';
import { IdeFile } from './ide-types';
export default function FileTreeSidebar({ files, currentPath, onNavigateUp, onOpenFile }: any) {
    return (
        <div className="ide-sidebar">
            <div className="ide-sidebar-header">Explorateur</div>
            <div className="ide-file-tree">
                {currentPath !== '/' && (
                    <div className="ide-tree-item" onClick={onNavigateUp}>
                        <span className="ide-tree-item-icon">📁</span> ..
                    </div>
                )}
                {files.map((f: IdeFile) => (
                    <div key={f.path} className="ide-tree-item" onClick={() => onOpenFile(f)}>
                        <span className="ide-tree-item-icon">{f.isDirectory ? '📁' : '📄'}</span>
                        <span className="truncate">{f.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
