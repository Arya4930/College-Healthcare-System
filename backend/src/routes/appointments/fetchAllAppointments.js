import express from "express";
import { authenticatedUser } from "../../lib/request-auth.js";
import { getRepositories } from "../../repositories/index.js";
const router=express.Router();
router.get("/",async(req,res)=>{try{const user=await authenticatedUser(req);if(!user)return res.status(401).json({success:false,message:"Unauthorized: No token"});if(user.type!=="student")return res.status(403).json({success:false,message:"Only students can book appointments"});const repos=getRepositories(),data=await repos.appointments.byStudent(user.ID);const people=await repos.users.byIds([...new Set(data.flatMap(a=>[a.doctor,a.parent]).filter(Boolean))]);const byId=new Map(people.map(p=>[p.ID,p]));return res.status(201).json({success:true,message:"Appointments fetched successfully",data:data.map(a=>({...a,doctorName:byId.get(a.doctor)?.name||null,doctorPhone:byId.get(a.doctor)?.phone||"",parentPhone:byId.get(a.parent)?.phone||""}))});}catch(error){console.error("Appointment fetch failed:",error instanceof Error?error.message:"Unknown error");return res.status(500).json({success:false,message:"Failed to fetch appointments"});}});
export default router;
