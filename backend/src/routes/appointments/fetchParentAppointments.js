import express from "express";
import { authenticatedUser } from "../../lib/request-auth.js";
import { getRepositories } from "../../repositories/index.js";
const router=express.Router();
router.get("/parent",async(req,res)=>{try{const user=await authenticatedUser(req);if(!user)return res.status(401).json({success:false,message:"Unauthorized: No token"});if(user.type!=="parent")return res.status(403).json({success:false,message:"Only parents can view this"});const repos=getRepositories(),data=await repos.appointments.byParent(user.ID),doctors=await repos.users.byIds([...new Set(data.map(a=>a.doctor).filter(Boolean))]),phones=new Map(doctors.map(d=>[d.ID,d.phone]));return res.status(200).json({success:true,message:"Appointments fetched successfully",data:data.map(a=>({...a,doctorPhone:phones.get(a.doctor)||""}))});}catch(error){console.error("Parent appointments failed:",error instanceof Error?error.message:"Unknown error");return res.status(500).json({success:false,message:"Failed to fetch appointments"});}});
export default router;
