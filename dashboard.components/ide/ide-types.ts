export interface IdeFile { name: string; path: string; isDirectory: boolean; isSymlink: boolean; size: number; mode: string; content?: string; }
export interface IdeTab { id: string; path: string; name: string; isDirty: boolean; }
