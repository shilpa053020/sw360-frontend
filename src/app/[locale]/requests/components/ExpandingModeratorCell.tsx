// Copyright (C) Siemens AG, 2023. Part of the SW360 Frontend Project.

// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/

// SPDX-License-Identifier: EPL-2.0
// License-Filename: LICENSE

'use client'


import React, { useState } from 'react';
import Link from 'next/link'

interface ModeratorCellProps {
    moderators: string[];
}

const ExpandingModeratorCell: React.FC<ModeratorCellProps> = ({ moderators }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <button className='btn-dark' onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Hide Moderators' : 'Show Moderators'}
            </button>
            {expanded && (
                <div>
                    {moderators.map((email, index) => (
                        <li key={index}>
                            <Link href={`mailto:${email}`} className='text-link'>
                                {email}
                            </Link>
                        </li>
                    ))}
                </div>
            )}
        </>
    );
};

export default ExpandingModeratorCell;
