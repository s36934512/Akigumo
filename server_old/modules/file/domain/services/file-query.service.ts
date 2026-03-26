import FileRepository from '@modules/file/data/repositories/file.repository';
import GraphLinkOrchestrator from '@orchestrators/graph-link.orchestrator';

interface FileQueryServiceDeps {
    graphLinkOrchestrator: GraphLinkOrchestrator;
    fileRepository: FileRepository;
}

export default class FileQueryService {

    constructor(private deps: FileQueryServiceDeps) { }

    private get graphLinkOrchestrator() { return this.deps.graphLinkOrchestrator; }
    private get fileRepository() { return this.deps.fileRepository }

    public async getFilesByItem(itemId: string) {
        const neo4jResult = await this.graphLinkOrchestrator.getFilesByItem(itemId);
        const files = await this.fileRepository.findMany({
            where: {
                id: { in: neo4jResult }
            },
        });

        console.log(files);

        const orderedFiles = neo4jResult.map(id => files.find(f => f.id === id)).filter(Boolean);

        return orderedFiles;
    }

    public async getFileExtensionByType(mimeType: string) {
        let fileExtension = await this.fileRepository.findFileExtensionByType(mimeType);

        if (fileExtension) {
            return fileExtension;
        }

        let category = await this.fileRepository.findFileCategoryUnique(
            { code: 'default' }
        );
        if (!category) {
            category = await this.fileRepository.createFileCategory({
                name: 'default',
                code: 'default',
                description: 'Default file category'
            });
        }

        // fileExtension = await this.fileRepository.createExtension({
        //     code: mimeType.split('/')[1] || 'unknown',
        //     mimeType,
        //     category: { connect: { id: category.id } },
        // });
        fileExtension = await this.fileRepository.findExtensionByCode(mimeType.split('/')[1] || 'unknown');

        return fileExtension;
    }
}