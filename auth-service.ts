import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import { firebaseAuth, googleProvider } from "./firebase";

export interface AuthUser {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

function mapFirebaseUser(user: User): AuthUser {
  return {
    email: user.email ?? "",
    displayName: user.displayName,
    avatarUrl: user.photoURL,
  };
}

export async function registerWithEmail(
  email: string,
  password: string,
  username: string,
): Promise<AuthUser> {
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );

  await updateProfile(credential.user, {
    displayName: username,
  });

  return {
    ...mapFirebaseUser(credential.user),
    displayName: username,
  };
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );

  return mapFirebaseUser(credential.user);
}

export async function loginWithGoogle(): Promise<AuthUser> {
  const credential = await signInWithPopup(firebaseAuth, googleProvider);

  return mapFirebaseUser(credential.user);
}

export async function logoutFromFirebase(): Promise<void> {
  await signOut(firebaseAuth);
}
