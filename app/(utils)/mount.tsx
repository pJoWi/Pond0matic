"use client";
import { useEffect } from "react";
import { mountBubbles } from "./bubbles";
export default function Mount(){ useEffect(() => { mountBubbles(); }, []); return null; }
