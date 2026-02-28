import express from "express";
import dotenv from "dotenv";
import router from "./routes";
dotenv.config();

const app = express();
app.set("trust proxy", true);

app.use(express.json());
app.use("/", router);

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`Server Running on port ${PORT}`);
})