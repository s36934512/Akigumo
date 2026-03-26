import { defineConfig } from 'orval';

export default defineConfig({
    petstore: {
        output: {
            mode: 'tags-split',
            target: './src/data-access/api/generated.ts',
            schemas: './src/data-access/api/model',
            client: 'angular',
            mock: false,
            override: {
                mutator: {
                    path: './src/data-access/api/mutator.ts',
                    name: 'customInstance',
                },
            },
        },
        input: {
            target: 'http://localhost:3049/api/v1/doc',
        },
    },
    petstoreZod: {
        input: {
            target: 'http://localhost:3049/api/v1/doc',
        },
        output: {
            target: './src/data-access/api/zod',
            client: 'zod',
        },
    },
});
