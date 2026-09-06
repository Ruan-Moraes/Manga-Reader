# Trechos da revisão estática

Linhas e SHA-256 da árvore auditada. Evidência de mecanismo, não de latência nativa.

## src/widgets/chapter-reader/ui/ReaderViewport.tsx

SHA-256: `e1f8cb68398b095e18bdbc20ddb64039e42ff49e88bdc44db655deffce7639ed`

```text
95:
96:     const restoreLogicalPage = useCallback(() => {
97:         if (!currentId) return;
98:         const y = pageOffset([...layoutsRef.current.values()], currentId);
99:         if (y !== null) scrollRef.current?.scrollTo({ y, animated: false });
100:     }, [currentId]);
101:
102:     useEffect(() => {
103:         restoreLogicalPage();
104:     }, [height, restoreLogicalPage, settings.fit, settings.gap, width]);
105:
106:     useEffect(() => {
107:         const urls = adjacentPages(pages, currentPage, settings.preload).map(page => page.imageUrl);
108:         if (urls.length) void Image.prefetch(urls).catch(() => undefined);
109:     }, [currentPage, pages, settings.preload]);
110:
111:     const retryPage = useCallback((pageId: string) => {
112:         setFailedPages(current => {
113:             const next = new Set(current);
114:             next.delete(pageId);
115:             return next;
116:         });
117:         setRetryVersions(current => ({ ...current, [pageId]: (current[pageId] ?? 0) + 1 }));
118:     }, []);
119:
120:     const markPageAsFailed = useCallback((pageId: string) => {
121:         setFailedPages(current => new Set(current).add(pageId));
122:     }, []);
123:
124:     const recordPageLayout = useCallback(
125:         (pageId: string, event: LayoutChangeEvent) => {
126:             const { height: pageHeight, y } = event.nativeEvent.layout;
127:             layoutsRef.current.set(pageId, { id: pageId, y, height: pageHeight });
128:             if (pageId === currentId) restoreLogicalPage();
129:         },
130:         [currentId, restoreLogicalPage],
131:     );
132:
133:     const renderPage = (page: ChapterPage) => (
134:         <ReaderPage
135:             key={page.id}
136:             page={page}
137:             pageNumber={pages.indexOf(page) + 1}
138:             totalPages={pages.length}
139:             failed={failedPages.has(page.id)}
140:             retryVersion={retryVersions[page.id] ?? 0}
141:             fit={settings.fit}
142:             saturation={settings.saturation}
143:             width={width}
144:             height={height}
145:             verticalMode={mode === 'VERTICAL'}
146:             failureGap={spacing.md}
147:             onRetry={retryPage}
148:             onImageError={markPageAsFailed}
149:             onLayout={recordPageLayout}
150:         />
151:     );
152:
153:     if (mode === 'VERTICAL') {
154:         return (
155:             <ScrollView
156:                 ref={scrollRef}
157:                 testID="reader-vertical"
158:                 style={{ flex: 1, backgroundColor: readerBackgroundColor(settings.background, tokens) }}
159:                 contentContainerStyle={{ gap: settings.gap }}
160:                 onContentSizeChange={restoreLogicalPage}
161:                 onMomentumScrollEnd={event => {
162:                     const id = pageAtOffset([...layoutsRef.current.values()], event.nativeEvent.contentOffset.y);
163:                     const page = id ? pages.findIndex(candidate => candidate.id === id) + 1 : 1;
164:                     onCurrentPageChange(Math.min(pages.length, Math.max(1, page)));
165:                 }}
166:             >
167:                 {items.flat().map(renderPage)}
168:             </ScrollView>
169:         );
170:     }
171:
172:     const item = items[itemIndex] ?? items[0] ?? [];
173:     return (
174:         <View
175:             testID="reader-paged"
```

## src/pages/reader/ui/ReaderPage.tsx

SHA-256: `6d8fd2fc306948eacecb50703f95767e9e16b76303dac2b3c99ea333bc34ab9a`

```text
28: function IdentityReaderPage({ titleId, requestedChapter, identityEpoch, isAuthenticated }: IdentityProps) {
29:     const { t } = useTranslation('reader');
30:     const { spacing, tokens, typography } = useTheme();
31:     const settings = useSettingsStore(state => state.settings);
32:     const updateSettings = useSettingsStore(state => state.updateSettings);
33:     const synchronizer = useRef(new ProgressSynchronizer()).current;
34:     const [chapterNumber, setChapterNumber] = useState(requestedChapter);
35:     const [currentPage, setCurrentPage] = useState(1);
36:     const [controlsVisible, setControlsVisible] = useState(true);
37:     const [resumeResolved, setResumeResolved] = useState(!isAuthenticated);
38:     const [pendingResume, setPendingResume] = useState<ReadingProgress | null>(null);
39:     const [suppressHydrationWrite, setSuppressHydrationWrite] = useState(false);
40:     const [syncError, setSyncError] = useState(false);
41:     const unavailableDiagnosticReported = useRef(false);
42:     const exitReader = () => navigateBackOrReplace(ROUTES.ROOT);
43:
44:     const chapterQuery = useQuery(chapterReaderQueryOptions(titleId, chapterNumber));
45:     const progressQuery = useQuery({
46:         queryKey: readingProgressQueryKeys.byTitle(identityEpoch, titleId),
47:         queryFn: ({ signal }) => getReadingProgress(titleId, signal),
48:         enabled: isAuthenticated,
49:         retry: false,
50:     });
210:             onRetryProgress={() => void synchronizer.retry().then(() => setSyncError(synchronizer.getState().status === 'error'))}
211:             onRetryProgressHydration={() => void progressQuery.refetch()}
212:         />
213:     );
214: }
215:
216: export function ReaderPage(props: Props) {
217:     const { identityEpoch, isAuthenticated } = useSessionStore();
218:     const identityKey = `${isAuthenticated ? 'account' : 'guest'}:${identityEpoch}:${props.titleId}:${props.requestedChapter}`;
219:
220:     return <IdentityReaderPage key={identityKey} {...props} identityEpoch={identityEpoch} isAuthenticated={isAuthenticated} />;
221: }
```

## src/entities/local-media-import/api/localMediaImportRepository.ts

SHA-256: `d731292fea6be7043699558cd52664278d222409c5328cbfc117841db79e4c68`

```text
329: async function getDraftFrom(executor: SqlExecutor, draftId?: string): Promise<LocalMediaImportDraft | null> {
330:     const draft = await executor.getFirstAsync<DraftRow>(
331:         draftId
332:             ? "SELECT id, created_at, updated_at, confirmed_at, source_language, target_language, languages_confirmed_at FROM local_media_import_drafts WHERE slot = 'active' AND id = ? LIMIT 1"
333:             : "SELECT id, created_at, updated_at, confirmed_at, source_language, target_language, languages_confirmed_at FROM local_media_import_drafts WHERE slot = 'active' LIMIT 1",
334:         draftId ? [draftId] : [],
335:     );
336:     if (!draft) return null;
337:     if (!isTranslationLanguageCode(draft.source_language) || !isTranslationLanguageCode(draft.target_language)) {
338:         throw new Error('localMediaImport.invalidLanguageCode');
339:     }
340:
341:     const items = await executor.getAllAsync<ItemRow>(
342:         `SELECT id, position, local_filename, byte_size, mime_hint, created_at,
343:                 media_validation_status, media_validation_error, detected_mime_type,
344:                 width_px, height_px, validated_at, validation_policy_version
345:          FROM local_media_import_items WHERE draft_id = ? ORDER BY position ASC`,
346:         [draft.id],
347:     );
348:     return {
349:         id: draft.id,
350:         createdAt: draft.created_at,
351:         updatedAt: draft.updated_at,
352:         confirmedAt: draft.confirmed_at ?? null,
353:         sourceLanguage: draft.source_language,
354:         targetLanguage: draft.target_language,
355:         languagesConfirmedAt: draft.languages_confirmed_at ?? null,
356:         items: items.map(mapItem),
357:     };
358: }
359:
360: async function requireDraft(executor: SqlExecutor, draftId: string): Promise<LocalMediaImportDraft> {
361:     const draft = await getDraftFrom(executor, draftId);
362:     if (!draft) throw new Error('localMediaImport.draftNotFound');
363:     return draft;
364: }
365:
366: async function persistOrder(executor: SqlExecutor, draftId: string, orderedItemIds: readonly string[]): Promise<void> {
367:     const offset = orderedItemIds.length + 1;
368:     await executor.runAsync('UPDATE local_media_import_items SET position = position + ? WHERE draft_id = ?', [offset, draftId]);
369:     for (const [position, itemId] of orderedItemIds.entries()) {
370:         await executor.runAsync('UPDATE local_media_import_items SET position = ? WHERE draft_id = ? AND id = ?', [position, draftId, itemId]);
594:             return result;
595:         },
596:         async updateMediaValidation(draftId, itemId, validation, updatedAt, expectedUpdatedAt) {
597:             const db = await database();
598:             let result: LocalMediaImportDraft | null = null;
599:             await db.withExclusiveTransactionAsync(async transaction => {
600:                 const current = await requireDraft(transaction, draftId);
601:                 if (current.updatedAt !== expectedUpdatedAt) throw new Error('localMediaImport.staleDraft');
602:                 if (!current.items.some(item => item.id === itemId)) throw new Error('localMediaImport.itemNotFound');
603:                 await transaction.runAsync(
604:                     `UPDATE local_media_import_items SET
605:                         media_validation_status = ?, media_validation_error = ?, detected_mime_type = ?,
606:                         width_px = ?, height_px = ?, validated_at = ?, validation_policy_version = ?
607:                      WHERE draft_id = ? AND id = ?`,
608:                     [
609:                         validation.mediaValidationStatus,
610:                         validation.mediaValidationError,
611:                         validation.detectedMimeType,
612:                         validation.widthPx,
613:                         validation.heightPx,
614:                         validation.validatedAt,
615:                         validation.validationPolicyVersion,
616:                         draftId,
617:                         itemId,
618:                     ],
619:                 );
620:                 await transaction.runAsync('UPDATE local_media_import_drafts SET updated_at = ? WHERE id = ?', [updatedAt, draftId]);
621:                 result = await requireDraft(transaction, draftId);
622:             });
623:             if (!result) throw new Error('localMediaImport.itemNotFound');
624:             return result;
625:         },
626:         async getReferencedDraftIds() {
627:             const rows = await (await database()).getAllAsync<{ id: string }>('SELECT id FROM local_media_import_drafts', []);
```

## src/features/validate-local-media/model/validateLocalMedia.ts

SHA-256: `99d2fcf5d14730de6f8415cc73aec71437608fca9f2c930ac8971ac9fc76c67a`

```text
100:                 options.onProgress?.({ completed: 0, total: pending.length });
101:                 for (const [index, selected] of pending.entries()) {
102:                     const item = current.items.find(candidate => candidate.id === selected.id);
103:                     if (!item) throw new ValidateLocalMediaError('stale-draft');
104:                     const uri = dependencies.files.fileUri(LOCAL_MEDIA_IMPORT_NAMESPACE, current.id, item.localFilename);
105:                     const result = await dependencies.inspect(uri, item.byteSize).catch(() => {
106:                         throw new ValidateLocalMediaError('storage-unavailable');
107:                     });
108:                     const updatedAt = Math.max(dependencies.now(), current.updatedAt + 1);
109:                     try {
110:                         current = await dependencies.repository.updateMediaValidation(
111:                             current.id,
112:                             item.id,
113:                             validationFields(result, updatedAt),
114:                             updatedAt,
115:                             current.updatedAt,
116:                         );
117:                     } catch (error) {
118:                         const code = error instanceof Error && error.message === 'localMediaImport.staleDraft' ? 'stale-draft' : 'storage-unavailable';
119:                         throw new ValidateLocalMediaError(code);
120:                     }
121:                     options.onProgress?.({ completed: index + 1, total: pending.length });
122:                 }
123:                 return current;
124:             });
125:         },
126:         replaceItem(draft, itemId) {
127:             return runExclusively(async () => {
128:                 const item = draft.items.find(candidate => candidate.id === itemId);
129:                 if (!item) throw new ValidateLocalMediaError('stale-draft');
130:
131:                 const selection = await dependencies.picker.pickImages({ selectionLimit: 1 });
132:                 if (selection.status === 'cancelled') return draft;
133:                 if (selection.status === 'error') {
134:                     throw new ValidateLocalMediaError(selection.code === 'invalid-result' ? 'invalid-selection' : 'picker-unavailable');
135:                 }
136:                 if (selection.images.length !== 1) throw new ValidateLocalMediaError('invalid-selection');
137:
138:                 const operationId = dependencies.createId();
139:                 const replacementFilename = `${item.id}-${operationId}`;
140:                 let promoted = false;
141:                 try {
142:                     const [stored] = await dependencies.files.stageBatch(LOCAL_MEDIA_IMPORT_NAMESPACE, operationId, [
143:                         { sourceUri: selection.images[0].uri, filename: replacementFilename },
144:                     ]);
145:                     await dependencies.files.promoteStagedFiles(LOCAL_MEDIA_IMPORT_NAMESPACE, operationId, draft.id, [stored.filename]);
146:                     promoted = true;
```

## src/shared/remote-gateway/remoteGatewayTransport.ts

SHA-256: `fd77344a545097ae245b90b0b88a84ba01a8ebfdb637a474fdb1bbd3ea77c14f`

```text
76:     };
77: }
78:
79: async function parseResponse(response: Response, origin: URL, maxResponseBytes: number): Promise<RemoteGatewayResponse> {
80:     if (response.url && new URL(response.url).origin !== origin.origin) throw new RemoteGatewayTransportError('redirect');
81:     const declaredLength = Number(response.headers.get('content-length'));
82:     if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) throw new RemoteGatewayTransportError('response-too-large');
83:     const text = await response.text();
84:     if (new TextEncoder().encode(text).length > maxResponseBytes) throw new RemoteGatewayTransportError('response-too-large');
85:     if (!text) return { status: response.status, headers: response.headers, body: null };
86:     try {
87:         return { status: response.status, headers: response.headers, body: JSON.parse(text) as unknown };
88:     } catch {
89:         throw new RemoteGatewayTransportError('invalid-response');
90:     }
```

## src/shared/files/jsonExport.ts

SHA-256: `369b70e99a227b2cf1c8414dac0e60bf9f7a24b9187dcc8c9f435673c46ded25`

```text
20:         if (!FileSystem.cacheDirectory) throw new Error('dataControls.error.exportUnavailable');
21:
22:         const filename = filenameFor(date);
23:         const uri = `${EXPORT_DIRECTORY}${filename}`;
24:         await FileSystem.makeDirectoryAsync(EXPORT_DIRECTORY, { intermediates: true });
25:
26:         try {
27:             await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2));
28:             if (!(await Sharing.isAvailableAsync())) throw new Error('dataControls.error.exportUnavailable');
29:             await Sharing.shareAsync(uri, { dialogTitle: filename, mimeType: 'application/json', UTI: 'public.json' });
30:             return { status: 'shared', filename };
31:         } finally {
32:             await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
33:         }
34:     },
35:     clearTemporaryFiles: async () => {
36:         if (!FileSystem.cacheDirectory) return;
37:         await FileSystem.deleteAsync(EXPORT_DIRECTORY, { idempotent: true });
38:     },
```

## src/features/data-controls/api/dataControlsApi.ts

SHA-256: `895484f55792de52f1719ba5c88b3a1460ee9343e7b251de4fc5c0055d134206`

```text
1: import { api } from '@/shared/api';
2:
3: export async function exportMyData(): Promise<unknown> {
4:     const response = await api.get<unknown>('/users/me/data-export');
5:     return response.data;
6: }
7:
8: export async function clearMyTrackedHistory(): Promise<void> {
```

## src/application/gates/RemoteProcessingRecoveryGate.tsx

SHA-256: `0f3887a9b7def299da1eb06b3d2b26ab4e1d760ea822ae0ae3b8d0dcbb86acb6`

```text
1: import { type PropsWithChildren, useCallback, useEffect } from 'react';
2: import { AppState } from 'react-native';
3:
4: import { remoteProcessingAttemptRepository } from '@/entities/remote-processing-attempt';
5: import { startRemoteProcessingController } from '@/features/start-remote-processing';
6:
7: export function RemoteProcessingRecoveryGate({ children }: PropsWithChildren) {
8:     const recover = useCallback(async () => {
9:         await remoteProcessingAttemptRepository.initialize();
10:         if ((await remoteProcessingAttemptRepository.listRecoverable()).length > 0) {
11:             await startRemoteProcessingController.reconcile();
12:         }
13:     }, []);
14:
15:     useEffect(() => {
16:         void recover().catch(() => undefined);
17:         const subscription = AppState.addEventListener('change', state => {
18:             if (state === 'active') void recover().catch(() => undefined);
19:         });
20:         return () => subscription.remove();
21:     }, [recover]);
22:
23:     return children;
24: }
```

## src/features/start-remote-processing/model/startRemoteProcessing.ts

SHA-256: `e0ae649d90bf9def7fab9a99ef86891f18fc3f7abc4c05b3d05feed4671da805`

```text
197:         async reconcile(signal) {
198:             let capabilities: RemoteProcessingCapabilities | null = null;
199:             try {
200:                 const loaded = await loadCapabilities(dependencies, signal);
201:                 capabilities = loaded.capabilities;
202:                 const session = await dependencies.identity.getSession(capabilities.gatewayKey, loaded.transport, signal);
203:                 const recoverable = await dependencies.attempts.listRecoverable();
204:                 for (const attempt of recoverable.filter(item => item.gatewayKey === capabilities!.gatewayKey)) {
205:                     const path = attempt.remoteJobRef
206:                         ? `/v1/page-jobs/${encodeURIComponent(attempt.remoteJobRef)}`
207:                         : `/v1/page-jobs/by-idempotency/${encodeURIComponent(attempt.idempotencyKey)}`;
208:                     const response = await loaded.transport.request(path, { token: session.accessToken, signal });
209:                     if (response.status === 404 && !attempt.remoteJobRef) {
210:                         const projectId = await dependencies.attempts.getProjectIdForPage(attempt.pageId);
211:                         const project = projectId ? await dependencies.projects.getById(projectId) : null;
212:                         const validated = validateProject(project, capabilities, dependencies.now());
213:                         const consent = await dependencies.attempts.getConsent(projectId!, capabilities.disclosure.version);
214:                         const exists = await dependencies.files.fileExists(TRANSLATION_PROJECT_NAMESPACE, projectId!, validated.page.originalFilename);
215:                         if (!consent || !exists) continue;
216:                         const submitting = await dependencies.attempts.markSubmitting(attempt.id, dependencies.now());
217:                         const replay = await loaded.transport.upload(
218:                             '/v1/page-jobs',
```

## src/shared/media-inspection/mediaInspection.ts

SHA-256: `d1844c09ec016319aacfb512971270c91c589e26a949774f8f96f5f422679604`

```text
62: function parsePng(head: Uint8Array, tail: Uint8Array): ParsedImage | null {
63:     const signature = [137, 80, 78, 71, 13, 10, 26, 10];
64:     if (head.length < 8 || !signature.every((byte, index) => head[index] === byte)) return null;
65:     if (head.length < 33 || !ascii(head, 12, 'IHDR') || !ascii(tail, Math.max(0, tail.length - 8), 'IEND')) throw new Error('CORRUPTED');
66:     return {
67:         mimeType: 'image/png',
68:         width: readUint32Be(head, 16),
69:         height: readUint32Be(head, 20),
70:         animated: Array.from({ length: Math.max(0, head.length - 3) }, (_, index) => index).some(index => ascii(head, index, 'acTL')),
71:     };
72: }
73:
74: function parseWebp(head: Uint8Array, size: number): ParsedImage | null {
108:         return { exists: file.exists, size: file.size };
109:     },
110:     read(uri, offset, length) {
111:         const handle = new File(uri).open();
112:         try {
113:             handle.offset = offset;
114:             return handle.readBytes(length);
115:         } finally {
116:             handle.close();
117:         }
118:     },
119:     async decode(uri) {
120:         const image = await Image.loadAsync({ uri }, { maxHeight: 2_048, maxWidth: 2_048 });
121:         image.release();
122:     },
123: };
124:
125: export async function inspectLocalImage(uri: string, expectedSize: number, io: MediaInspectionIo = expoMediaInspectionIo): Promise<MediaInspectionResult> {
126:     const metadata = io.metadata(uri);
127:     if (!metadata.exists) return { status: 'invalid', error: 'MISSING_FILE' };
128:     if (metadata.size === 0) return { status: 'invalid', error: 'EMPTY_FILE' };
129:     if (metadata.size !== expectedSize) return { status: 'invalid', error: 'FILE_CHANGED' };
130:     if (metadata.size > MAX_MEDIA_BYTES) return { status: 'invalid', error: 'DIMENSIONS_UNSAFE' };
131:
132:     let parsed: ParsedImage | null;
133:     try {
134:         const head = io.read(uri, 0, Math.min(metadata.size, 262_144));
135:         const tailLength = Math.min(metadata.size, 4_096);
136:         const tail = io.read(uri, metadata.size - tailLength, tailLength);
137:         parsed = parseImageStructure(head, tail, metadata.size);
138:         if (!parsed) return { status: 'invalid', error: 'UNSUPPORTED_FORMAT' };
139:         if (parsed.animated) return { status: 'invalid', error: 'UNSUPPORTED_FORMAT', mimeType: parsed.mimeType };
140:         const unsafe =
141:             parsed.width < 1 ||
142:             parsed.height < 1 ||
143:             parsed.width > MAX_MEDIA_SIDE_PX ||
144:             parsed.height > MAX_MEDIA_SIDE_PX ||
145:             parsed.width * parsed.height > MAX_MEDIA_PIXELS;
146:         if (unsafe) return { status: 'invalid', error: 'DIMENSIONS_UNSAFE', mimeType: parsed.mimeType, width: parsed.width, height: parsed.height };
147:     } catch {
148:         return { status: 'invalid', error: 'CORRUPTED' };
149:     }
150:
151:     await io.decode(uri);
152:     return { status: 'valid', mimeType: parsed.mimeType, width: parsed.width, height: parsed.height };
153: }
```

## src/shared/api/apiClient.ts

SHA-256: `b9faed8ab67b9c46e37e350625d606603edbc72872bec853ab98c6481fdd40c3`

```text
16:         'X-Refresh-Token-Transport': 'body',
17:     },
18: });
19:
20: api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
21:     const token = await tokenStorage.getAccess();
22:
23:     config.headers['Accept-Language'] = getCurrentLanguage();
24:
25:     if (token) {
26:         config.headers.Authorization = `Bearer ${token}`;
27:     }
28:
29:     return config;
```

## src/shared/api/tokenStorage.ts

SHA-256: `9822db905616ab187f1d088de70c3976efe1d0efd002d742e2da0410c2a2c8ee`

```text
10:     accessToken: string;
11:     refreshToken: string;
12: }
13:
14: const readTokens = async (): Promise<StoredTokens | null> => {
15:     const stored = await SecureStore.getItemAsync(STORAGE_KEYS.TOKENS);
16:     if (stored) {
17:         try {
18:             const parsed = JSON.parse(stored) as Partial<StoredTokens>;
19:             if (typeof parsed.accessToken === 'string' && parsed.accessToken && typeof parsed.refreshToken === 'string' && parsed.refreshToken) {
20:                 return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
21:             }
22:         } catch {
23:             // O fallback legado abaixo permite recuperar sessões anteriores à migração.
24:         }
25:     }
26:
27:     const [accessToken, refreshToken] = await Promise.all([
28:         SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
29:         SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
30:     ]);
31:     return accessToken && refreshToken ? { accessToken, refreshToken } : null;
32: };
33:
34: export const tokenStorage = {
35:     getAccess: async () => (await readTokens())?.accessToken ?? null,
36:     getRefresh: async () => (await readTokens())?.refreshToken ?? null,
37:     setTokens: async (access: string, refresh: string) => {
```

## src/application/gates/SettingsGate.tsx

SHA-256: `780e917979537f563ef8fa73324e93247938bb930305271da5dcb7ed33577838`

```text
25:     });
26:     const hydrateSettings = useSettingsStore(state => state.hydrate);
27:     const isSettingsHydrated = useSettingsStore(state => state.isHydrated);
28:     const language = useSettingsStore(state => state.language);
29:
30:     useEffect(() => {
31:         if (fontError) throw fontError;
32:     }, [fontError]);
33:
34:     useEffect(() => {
35:         void hydrateSettings();
36:     }, [hydrateSettings]);
37:
38:     useEffect(() => {
39:         if (isSettingsHydrated && i18n.language !== language) {
40:             void i18n.changeLanguage(language);
41:         }
42:     }, [isSettingsHydrated, language]);
43:
44:     useEffect(() => {
45:         if (fontsLoaded && isSettingsHydrated) {
46:             void SplashScreen.hideAsync();
47:         }
48:     }, [fontsLoaded, isSettingsHydrated]);
49:
50:     if (!fontsLoaded || !isSettingsHydrated) return <StartupFeedback label={t('startup.settings')} />;
51:
52:     return children;
53: }
```

## src/application/gates/SessionGate.tsx

SHA-256: `9458691d83a527864b1c864c365f905fe3ad0c59d193967627c12dac3f9362dc`

```text
19:     const consumedReturnTo = useRef<{ identityEpoch: number; route: string } | null>(null);
20:
21:     useEffect(() => {
22:         void restoreSession().finally(() => setIsHydrated(true));
23:     }, []);
24:
25:     useEffect(
26:         () =>
27:             subscribeAuthExpired(() => {
28:                 void clearExpiredSession().finally(() => router.replace(ROUTES.ROOT as never));
```
