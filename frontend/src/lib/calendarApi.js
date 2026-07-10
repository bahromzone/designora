const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
async function parse(response){const payload=await response.json();if(!response.ok)throw new Error(payload?.detail||"Calendar yuklanmadi");return payload;}
export const calendarApi={
 list:(params,token)=>{const query=new URLSearchParams(params);return fetch(`${API_URL}/api/calendar/events?${query}`,{headers:{Authorization:`Bearer ${token}`}}).then(parse);},
 create:(body,token)=>fetch(`${API_URL}/api/calendar/events`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(body)}).then(parse),
 remove:(id,token)=>fetch(`${API_URL}/api/calendar/events/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}}).then(parse),
};
