export interface IdeFile {
    name: string;
    path: string;
    content?: string;
    size?: number;
    modifiedAt?: string;
    isDirectory: false;
}

export interface IdeDirectoryEntry {
    name: string;
    path: string;
    isDirectory: true;
    children?: IdeTreeEntry[];
    isExpanded?: boolean;
    isLoading?: boolean;
}

export type IdeTreeEntry = IdeFile | IdeDirectoryEntry;

export interface IdeTab {
    id: string;
    name: string;
    path: string;
    content: string | null;
    isDirty: boolean;
    isLoading: boolean;
}

export type FileModeLanguage =
    | 'plaintext'
    | 'javascript'
    | 'typescript'
    | 'json'
    | 'yaml'
    | 'xml'
    | 'html'
    | 'css'
    | 'php'
    | 'python'
    | 'bash'
    | 'ini'
    | 'properties'
    | 'markdown';

export const EXTENSION_TO_LANGUAGE: Record<string, FileModeLanguage> = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    json: 'json',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    html: 'html',
    htm: 'html',
    css: 'css',
    php: 'php',
    py: 'python',
    sh: 'bash',
    bash: 'bash',
    ini: 'ini',
    properties: 'properties',
    conf: 'ini',
    cfg: 'ini',
    env: 'ini',
    md: 'markdown',
    txt: 'plaintext',
};

export function getLanguage(filename: string): FileModeLanguage {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    return EXTENSION_TO_LANGUAGE[ext] ?? 'plaintext';
}

export function getFileIcon(entry: IdeTreeEntry): string {
    if (entry.isDirectory) return '📁';
    const ext = entry.name.split('.').pop()?.toLowerCase() ?? '';
    const icons: Record<string, string> = {
        js: '🟨', ts: '🔷', tsx: '⚛️', jsx: '⚛️',
        json: '📋', yml: '📋', yaml: '📋',
        php: '🐘', py: '🐍',
        html: '🌐', css: '🎨',
        sh: '⚡', bash: '⚡',
        md: '📝', txt: '📄',
        png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️',
        zip: '📦', tar: '📦', gz: '📦',
        log: '📜',
        env: '🔐', conf: '⚙️', cfg: '⚙️', ini: '⚙️',
        xml: '📰',
        jar: '☕', class: '☕',
    };
    return icons[ext] ?? '📄';
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
