import * as admin from "firebase-admin";
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';

// Initialize the Firebase Admin SDK
// The SDK is automatically initialized in Cloud Functions environments
// const admin = require('firebase-admin');
// admin.initializeApp();


// Firestore trigger to listen for updates in the 'users' collection
export const onUserAdminStatusUpdate = onDocumentUpdated('users/{userId}', async (event) => {
    const snapshot = event.data; // Get the snapshot of the document

    if (!snapshot) {
        logger.log('No data associated with the event');
        return null;
    }

    const beforeData = snapshot.before.data();
    const afterData = snapshot.after.data();
    const userId = event.params.userId;

    // Check if the isAdmin field was changed to true
    if (beforeData.isAdmin !== afterData.isAdmin && afterData.isAdmin === true) {
        logger.log(`User ${userId} is now an admin. Setting custom claim.`);

        try {
            // Set custom user claims on the user's authentication record.
            await admin.auth().setCustomUserClaims(userId, { admin: true });
            logger.log(`Custom claim 'admin: true' set for user ${userId}.`);

        } catch (error) {
            logger.error(`Failed to set custom claim for user ${userId}:`, error);
        }
    } else if (beforeData.isAdmin !== afterData.isAdmin && afterData.isAdmin === false) {
        logger.log(`User ${userId} is no longer an admin. Removing custom claim.`);

        try {
            // Remove the admin custom claim by setting it to false (or null/undefined)
            await admin.auth().setCustomUserClaims(userId, { admin: false });
            logger.log(`Custom claim 'admin: false' set for user ${userId}.`);
        } catch (error) {
            logger.error(`Failed to remove custom claim for user ${userId}:`, error);
        }
    } else {
        // isAdmin field was not changed to true or false in a significant way
        logger.log(`isAdmin field not changed significantly for user ${userId}. No custom claim action needed.`);
    }

    return null; // Cloud Functions that handle background events should return null or a Promise resolving to null
});
