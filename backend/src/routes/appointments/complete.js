import express from "express";
import { authenticatedUser } from "../../lib/request-auth.js";
import { getRepositories } from "../../repositories/index.js";
const router=express.Router();
router.put("/complete/:id",async(req,res)=>{try{const user=await authenticatedUser(req);if(!user)return res.status(401).json({success:false,message:"Invalid user"});if(user.type!=="doctor")return res.status(403).json({success:false,message:"Only students can book appointments"});const {prescription,diagnosis}=req.body;return res.json({success:true,data:await getRepositories().appointments.update(req.params.id,{prescription,diagnosis,status:"completed"})});}catch(error){console.error("Appointment completion failed:",error instanceof Error?error.message:"Unknown error");return res.status(500).json({success:false,message:"Failed to add prescription"});}});
export default router;
