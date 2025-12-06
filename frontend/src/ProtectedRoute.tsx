import { Navigate } from "react-router-dom";
import { auth } from "./firebaseClient";
import type { JSX } from "react/jsx-dev-runtime";

interface Props {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: Props) {
  const user = auth.currentUser;
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
}