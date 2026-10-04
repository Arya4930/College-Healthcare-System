import express from "express";
import { authenticatedUser } from "../../lib/request-auth.js";
import { getRepositories } from "../../repositories/index.js";
const router=express.Router();
router.get("/",async(req,res)=>{try{const user=await authenticatedUser(req);if(!user)return res.status(401).json({success:false,message:"Unauthorized: No token"});if(user.type!=="doctor")return res.status(403).json({success:false,message:"Only students can book appointments"});const repos=getRepositories(),all=[...(await repos.appointments.pending()),...(await repos.appointments.byDoctor(user.ID))];const distinct=[...new Map(all.map(a=>[a._id,a])).values()],parents=await repos.users.byIds([...new Set(distinct.map(a=>a.parent).filter(Boolean))]),phones=new Map(parents.map(p=>[p.ID,p.phone]));return res.json({success:true,data:distinct.map(a=>({...a,parentPhone:phones.get(a.parent)||""}))});}catch(error){console.error("Doctor appointments failed:",error instanceof Error?error.message:"Unknown error");return res.status(500).json({success:false,message:"Failed to fetch appointments"});}});
export default router;
