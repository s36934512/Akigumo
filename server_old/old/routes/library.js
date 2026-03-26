// import express from 'express';
// import services from '../services/index.js';

// const router = express.Router();
// const { libraryService } = services;

// /**
//  * POST /api/library/scan
//  * Triggers a scan of the media library.
//  * This is an async operation and will return immediately.
//  * 
//  * Body: { "path": "/path/to/scan" } (optional)
//  */
// router.post('/scan', (req, res) => {
//     // Default path to scan if not provided in the request body.
//     const defaultScanPath = 'storage/library';
//     const scanPath = req.body.path || defaultScanPath;

//     // Don't await the promise, let it run in the background
//     libraryService.scanLibrary(scanPath)
//         .then(() => {
//             console.log(`Library scan for path "${scanPath}" completed successfully.`);
//         })
//         .catch(error => {
//             console.error(`Library scan for path "${scanPath}" failed:`, error);
//         });

//     res.status(202).json({ message: 'Library scan initiated.', path: scanPath });
// });

// export default router;
