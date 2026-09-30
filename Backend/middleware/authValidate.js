
import { verfiyToken } from "../utils/jwt.js";
import db from "../config/db.js";

export const authMiddleware = (req,res,next)=>{
    const token = req.cookies.token;
    // console.log(token);

    if(!token){
         return res.status(401).json({message:"Not logged In"})
    }

    const decoded = verfiyToken(token);
    console.log("Decoded in middleware",decoded);

    

    


    if(!decoded){
        return res.status(401).json({message:"Invalid or Expired token"})
    }

    req.user = decoded;
    next();
}

export const interviewervalidation = async(req,res,next)=>{
    const token = req.cookies.token;
    console.log("interviewervalidation middleware hit, token:", token);

    if(!token){
         return res.status(401).json({message:"Not logged In"})
    }

    const decoded = verfiyToken(token);
    console.log("Decoded in middleware",decoded);

    if(!decoded){
        return res.status(401).json({message:"Invalid or Expired token"})
    }

    const [rows] = await db.execute(
      "SELECT role FROM users WHERE user_id = ?",
      [decoded.id]
    );

    if(rows.length === 0 || rows[0].role !== "interviewer"){
      return res.status(403).json({message:"Access denied. Interviewer role required."})
    }

    req.user = decoded;
    next();
}