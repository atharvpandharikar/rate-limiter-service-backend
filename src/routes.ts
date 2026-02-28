import express from "express";
import {rateLimiter} from "./rateLimiter";

const router = express.Router();

router.get("/data", rateLimiter, (req, res)=>{
    res.json({message : "You accessed data!"})
})

export default router;