export default function AdSenseReadiness(){
 const clientId=process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
 const valid=!!clientId&&/^ca-pub-\d{10,30}$/.test(clientId);
 return <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5"><h2 className="font-extrabold text-amber-950">Google AdSense readiness</h2><p className="mt-2 text-sm leading-6 text-amber-900">Ad placements are prepared, but AdSense is not activated. Apply with Google, complete site review, add the publisher ID only after approval, and publish the required ads.txt record when Google supplies it.</p><p className="mt-3 text-xs font-bold text-amber-800">{valid?"Publisher ID detected; consent-gated script activation still requires final review.":"Publisher ID not configured — no AdSense script or ad requests are sent."}</p></section>;
}
