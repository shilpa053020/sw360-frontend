// Copyright (C) TOSHIBA CORPORATION, 2023. Part of the SW360 Frontend Project.
// Copyright (C) Toshiba Software Development (Vietnam) Co., Ltd., 2023. Part of the SW360 Frontend Project.

// This program and the accompanying materials are made
// available under the terms of the Eclipse Public License 2.0
// which is available at https://www.eclipse.org/legal/epl-2.0/

// SPDX-License-Identifier: EPL-2.0
// License-Filename: LICENSE

'use client'
import { COMMON_NAMESPACE } from '@/object-types/Constants'
import { useTranslations } from 'next-intl'
import React, { useRef, useState } from 'react'
import { Modal, Button, Alert } from 'react-bootstrap'
import styles from '../components.module.css'
import ApiUtils from '@/utils/api/api.util'
import { Session } from '@/object-types/Session'
import HttpStatus from '@/object-types/enums/HttpStatus'
import { useRouter } from 'next/navigation'
import Component from '@/object-types/Component'

interface Props {
    show: boolean
    setShow: React.Dispatch<React.SetStateAction<boolean>>
    session: Session
}

enum ImportSBOMState {
    INIT_STATE,
    PREPARE_IMPORT,
    IMPORTING,
    IMPORTED,
    IMPORT_ERROR,
}

interface PrepareImportData {
    message?: string
    componentsName?: string
    releasesName?: string
}

const ImportSBOMModal = ({ show, setShow, session }: Props) => {
    const t = useTranslations(COMMON_NAMESPACE)
    const [importState, setImportState] = useState(ImportSBOMState.INIT_STATE)
    const [prepateImportData, setPrepareImportData] = useState<PrepareImportData | undefined>(undefined)
    const [notAllowedMessageDisplayed, setNotAllowedMessageDisplayed] = useState(false)
    const selectedFile = useRef<File | undefined>(undefined)
    const inputRef = useRef<HTMLInputElement>(undefined)
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        selectedFile.current = e.currentTarget.files[0]
        if (!selectedFile) {
            return
        }

        if (!selectedFile.current.name.endsWith('.rdf') && !selectedFile.current.name.endsWith('.spdx')) {
            setNotAllowedMessageDisplayed(true)
            return
        }
        setImportState(ImportSBOMState.IMPORTING)
        prepareImport().catch((err) => console.error(err))
    }

    const prepareImport = async () => {
        setNotAllowedMessageDisplayed(false)
        const formData = new FormData()
        formData.append('file', selectedFile.current, selectedFile.current.name)

        const response = await ApiUtils.POST(
            'components/prepareImport/SBOM?type=SPDX',
            formData,
            session.user.access_token
        )
        if (response.status === HttpStatus.OK) {
            const responseData = (await response.json()) as PrepareImportData
            setPrepareImportData(responseData)
            setImportState(ImportSBOMState.PREPARE_IMPORT)
        } else if (response.status === HttpStatus.INTERNAL_SERVER_ERROR) {
            setImportState(ImportSBOMState.IMPORT_ERROR)
        }
    }

    const importFile = async () => {
        const formData = new FormData()
        formData.append('file', selectedFile.current, selectedFile.current.name)

        try {
            const response = await ApiUtils.POST(
                'components/import/SBOM?type=SPDX',
                formData,
                session.user.access_token
            )
            if (response.status === HttpStatus.OK) {
                const responseData = (await response.json()) as Component
                router.push(`/components/detail/${responseData.id}`)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handleBrowseFile = () => {
        inputRef.current?.click()
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            selectedFile.current = e.dataTransfer.files[0]
            if (!selectedFile.current.name.endsWith('.rdf') && !selectedFile.current.name.endsWith('.spdx')) {
                setNotAllowedMessageDisplayed(true)
                return
            }
            setImportState(ImportSBOMState.IMPORTING)
            prepareImport().catch((err) => console.log(err))
        }
    }

    const closeModal = () => {
        setShow(false)
        setNotAllowedMessageDisplayed(false)
        setImportState(ImportSBOMState.INIT_STATE)
    }

    return (
        <Modal show={show} onHide={() => closeModal()} backdrop='static' centered size='lg'>
            <Modal.Header closeButton>
                <Modal.Title>
                    <b>{t('Upload SBOM')}</b>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert
                    variant='danger'
                    onClose={() => setNotAllowedMessageDisplayed(false)}
                    dismissible
                    show={notAllowedMessageDisplayed}
                >
                    {selectedFile.current &&
                        `${selectedFile.current.name} has type not allowed, please upload files of type rdf,spdx.`}
                </Alert>
                {(importState === ImportSBOMState.INIT_STATE || importState === ImportSBOMState.IMPORT_ERROR) && (
                    <>
                        <div>
                            <h4>
                                <b>{t('Upload BOM document as')}</b>
                            </h4>
                            {t('This currently only supports SPDX RDF/XML files with a uniq described top level node')}.
                            <br />
                            {t('If the wrong SPDX is entered, the information will not be registered correctly')}.
                        </div>
                        <div>
                            <div className={`${styles['modal-body-first']}`}>
                                <div
                                    className={`${styles['modal-body-second']}`}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    <span>{t('Drop a File Here')}</span>
                                    <br />
                                    {t('Or')}
                                    <br />
                                    <input
                                        className={`${styles['input']}`}
                                        ref={inputRef}
                                        type='file'
                                        accept='.rdf,.spdx'
                                        onChange={handleFileChange}
                                    />
                                    <button className={`${styles['button-browse']}`} onClick={handleBrowseFile}>
                                        {t('Browse')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {importState === ImportSBOMState.IMPORTING && <h4>{t('Importing')}...</h4>}
                {importState === ImportSBOMState.PREPARE_IMPORT && (
                    <>
                        {prepateImportData.message ? (
                            <h4> {prepateImportData.message} </h4>
                        ) : (
                            <div>
                                <p>
                                    <b>
                                        {t('The new Component and new Release will be created, do you want to import?')}
                                    </b>
                                </p>
                                <div>
                                    <span>{t('New Components')}: </span>
                                    <b>{prepateImportData.componentsName}</b>
                                </div>
                                <div>
                                    <span>{t('New Release')}s: </span>
                                    <b>{prepateImportData.releasesName}</b>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Body>
                {importState === ImportSBOMState.IMPORT_ERROR && (
                    <>
                        <h4> {'Failed :('} </h4>
                        <div>
                            {JSON.stringify({ readyState: 4, responseText: '', status: 500, statusText: 'error' })}
                        </div>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className='justify-content-end'>
                {importState === ImportSBOMState.PREPARE_IMPORT && !prepateImportData.message && (
                    <Button
                        type='button'
                        className={`fw-bold btn btn-primary button-orange`}
                        onClick={() => void importFile()}
                    >
                        {t('Import')}
                    </Button>
                )}
                <Button
                    type='button'
                    data-bs-dismiss='modal'
                    className={`fw-bold btn btn-light button-plain me-2`}
                    onClick={() => closeModal()}
                >
                    {t('Close')}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default ImportSBOMModal
