import React from 'react';
import { IdeTab } from './ide-types';
export default function FileEditorTabs({ tabs, activeTabId, fileContents, onTabSelect, onTabClose, onContentChange, onSave }: any) {
    const activeTab = tabs.find((t: IdeTab) => t.id === activeTabId);
    return (
        <div className="ide-main">
            {tabs.length > 0 ? (
                <>
                    <div className="ide-tabs">
                        {tabs.map((tab: IdeTab) => (
                            <div key={tab.id} className={`ide-tab ${tab.id === activeTabId ? 'active' : ''}`} onClick={() => onTabSelect(tab.id)}>
                                <span>{tab.name} {tab.isDirty ? '*' : ''}</span>
                                <span className="ide-tab-close" onClick={(e) => { e.stopPropagation(); onTabClose(tab.id); }}>×</span>
                            </div>
                        ))}
                    </div>
                    <div className="ide-editor-area">
                        {activeTab && (
                            <textarea className="ide-textarea" value={fileContents[activeTab.path] || ''}
                                onChange={(e) => onContentChange(activeTab.path, e.target.value)}
                                onKeyDown={(e) => {
                                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                                        e.preventDefault();
                                        onSave(activeTab.path, fileContents[activeTab.path]);
                                    }
                                }} spellCheck="false"
                            />
                        )}
                    </div>
                </>
            ) : (
                <div className="ide-empty-state"><div style={{fontSize: '48px'}}>📂</div><p>Sélectionnez un fichier pour l'ouvrir.</p></div>
            )}
        </div>
    );
}
