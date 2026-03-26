// import enums from './seedData/enums.json'

// async function seedEnums() {
//     console.log('Seeding enums...');
//     for (const [modelName, data] of Object.entries(enums)) {
//         const model = (prisma as any)[modelName];
//         if (model) {
//             for (const item of data as any[]) {
//                 await model.upsert({
//                     where: { code: item.code },
//                     update: { code: item.code, name: item.name },
//                     create: item,
//                 });
//             }
//         }
//     }
//     console.log('Enums seeded.');
// }

// async function main() {
//     await seedEnums();
// }

// main().then(async () => {
//     await prisma.$disconnect()
// }).catch(async (e) => {
//     console.error(e)
//     await prisma.$disconnect()
//     process.exit(1)
// })
