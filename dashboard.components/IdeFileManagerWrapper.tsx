import React from 'react';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import IdeFileManager from './ide/IdeFileManager';
export default () => {
    return (
        <ServerContentBlock title={"IDE"} className={"w-full"} showFlashKey={"ide"}>
            <IdeFileManager />
        </ServerContentBlock>
    );
};
