import express from "express";
import { authenticatedUser } from "../../lib/request-auth.js";
import { getRepositories } from "../../repositories/index.js";
import { logRouteFailure } from "../../lib/http-observability.js";
const router = express.Router();
router.post("/", async (req,res)=>{ try { const user=await authenticatedUser(req); if(!user)return res.status(401).json({success:false,message:"Unauthorized: No token"}); if(user.type!=="student")return res.status(403).json({success:false,message:"Only students can book appointments"}); const {date,reason}=req.body; if(!date||!reason)return res.status(400).json({success:false,message:"Date and reason required"}); const data=await getRepositories().appointments.create({student:user.ID,parent:user.parent||null,date,reason,status:"pending"}); return res.status(201).json({success:true,message:"Appointment request sent",data}); }catch{logRouteFailure(req,"appointment_booking_failed",500);return res.status(500).json({success:false,message:"Failed to book appointment"});} });
export default router;
