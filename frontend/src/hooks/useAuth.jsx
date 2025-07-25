import { useContext } from "react";
import AuthContext from "../Context/JWTContext";

const useAuth = () => useContext(AuthContext);

export default useAuth;