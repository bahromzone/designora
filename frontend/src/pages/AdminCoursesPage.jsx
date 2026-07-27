import { useEffect, useState } from "react";
import AdminWorkspaceShell from "../components/AdminWorkspaceShell";
import { request } from "../lib/request";
import { useAuth } from "../context/AuthContext";

export default function AdminCoursesPage(){
 const {token}=useAuth(); const [courses,setCourses]=useState([]); const [error,setError]=useState("");
 useEffect(()=>{request("/api/admin/courses",{token}).then(setCourses).catch(e=>setError(e.message));},[token]);
 return <AdminWorkspaceShell><header className="admin-page-head"><div><div className="admin-kicker">Content operations</div><h1>Kurslar</h1><p>Barcha kurslarni ko'ring, holatini boshqaring va kontent oqimini kuzating.</p></div></header>{error&&<div className="admin-section">{error}</div>}<section className="admin-section"><table className="admin-table"><thead><tr><th>Kurs</th><th>Kategoriya</th><th>Narx</th><th>Holat</th></tr></thead><tbody>{courses.map(course=><tr key={course.id}><td><strong>{course.title}</strong><br/><small>{course.description||"Tavsif kiritilmagan"}</small></td><td>{course.category||"-"}</td><td>{course.price||0} so'm</td><td>{course.is_active?"Faol":"Yopiq"}</td></tr>)}</tbody></table>{!courses.length&&!error&&<p>Hozircha kurslar yo'q.</p>}</section></AdminWorkspaceShell>;
}
