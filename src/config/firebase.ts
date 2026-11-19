
import "dotenv/config";

import {
  initializeApp,
  applicationDefault,
  getApps,
} from "firebase-admin/app";

import { getFirestore } from "firebase-admin/firestore";

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: applicationDefault(),
      });

export const firestore = getFirestore(firebaseApp);
