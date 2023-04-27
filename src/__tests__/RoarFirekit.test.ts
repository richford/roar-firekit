/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { faker } from '@faker-js/faker';

import { RoarFirekit } from '../firestore/firekit';
import { IFirekit } from '../firestore/interfaces';
import { roarConfig } from './__utils__/firebaseConfig';

describe('RoarFirekit', () => {
  let firekit: RoarFirekit;
  let app: IFirekit;
  let admin: IFirekit;

  beforeAll(() => {
    firekit = new RoarFirekit({
      roarConfig,
      enableDbPersistence: false,
    });

    const assessmentApp = initializeApp({ projectId: roarConfig.app.projectId, apiKey: roarConfig.app.apiKey }, 'app');
    const adminApp = initializeApp({ projectId: roarConfig.admin.projectId, apiKey: roarConfig.admin.apiKey }, 'admin');

    app = {
      firebaseApp: assessmentApp,
      auth: getAuth(assessmentApp),
      db: getFirestore(assessmentApp),
    };

    admin = {
      firebaseApp: adminApp,
      auth: getAuth(adminApp),
      db: getFirestore(adminApp),
    };

    const originalWarn = console.warn;
    const originalInfo = console.info;
    console.warn = jest.fn();
    console.info = jest.fn();

    connectAuthEmulator(app.auth, `http://localhost:${roarConfig.app.emulatorPorts.auth}`);
    connectFirestoreEmulator(app.db, 'localhost', roarConfig.app.emulatorPorts.db);
    connectAuthEmulator(admin.auth, `http://localhost:${roarConfig.admin.emulatorPorts.auth}`);
    connectFirestoreEmulator(admin.db, 'localhost', roarConfig.admin.emulatorPorts.db);

    console.warn = originalWarn;
    console.info = originalInfo;
  });

  afterEach(async () => {
    await firekit.signOut();
  });

  it('contructs', () => {
    expect(firekit.roarConfig).toEqual(roarConfig);
    expect(firekit.app).toBeDefined();
    expect(firekit.admin).toBeDefined();

    // The user has not authenticated yet so we should expect userData to be undefined
    expect(firekit.userData).toBeUndefined();
  });

  it('registers with email/password', async () => {
    const email = faker.internet.email();
    const password = faker.internet.password();
    await firekit.registerWithEmailAndPassword({ email, password });

    expect(app.auth.currentUser).toBeDefined();
    expect(admin.auth.currentUser).toBeDefined();

    // Expect that the logged in user has the correct email
    expect(app.auth.currentUser!.email).toBe(email.toLowerCase());
    expect(admin.auth.currentUser!.email).toBe(email.toLowerCase());

    // Expect that firekit has correctly recorded the correct user
    expect(firekit.app.user).toBeDefined();
    expect(firekit.admin.user).toBeDefined();
    expect(firekit.app.user).toEqual(app.auth.currentUser);
    expect(firekit.admin.user).toEqual(admin.auth.currentUser);
  });

  it('logs in with email/password', async () => {
    const email = faker.internet.email();
    const password = faker.internet.password();

    await createUserWithEmailAndPassword(app.auth, email, password);
    await createUserWithEmailAndPassword(admin.auth, email, password);

    await firekit.logInWithEmailAndPassword({ email, password });

    // Expect that firekit has correctly recorded the correct user
    expect(firekit.app.user).toBeDefined();
    expect(firekit.admin.user).toBeDefined();
    expect(firekit.app.user).toEqual(app.auth.currentUser);
    expect(firekit.admin.user).toEqual(admin.auth.currentUser);
  });
});
