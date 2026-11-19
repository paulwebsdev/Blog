"use client";
import { useEffect, useRef } from "react";
export default function AdImpression({campaignId}:{campaignId:string}){
 const sent=useRef(false);
 useEffect(()=>{
  if(sent.current)return;
  sent.current=true;
  void fetch("/api/monetization/impression",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({campaignId}),keepalive:true}).catch(()=>{});
 },[campaignId]);
 return null;
}
