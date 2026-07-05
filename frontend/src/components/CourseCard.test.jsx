import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CourseCard from "./CourseCard";

const course = {
  title: "Moda illyustratsiyasi",
  subtitle: "Amaliy kurs",
  description: "Qalamdan raqamli chizmagacha",
  level: "Boshlang'ich",
  duration: "6 soat",
  lessons: 12,
  image_url: "http://img/course.png",
};

describe("CourseCard", () => {
  it("renders course title and subtitle", () => {
    render(<CourseCard course={course} />);
    expect(screen.getByText("Moda illyustratsiyasi")).toBeInTheDocument();
    expect(screen.getByText("Amaliy kurs")).toBeInTheDocument();
  });

  it("renders level, duration and lessons count", () => {
    render(<CourseCard course={course} />);
    expect(screen.getByText("Boshlang'ich")).toBeInTheDocument();
    expect(screen.getByText("6 soat")).toBeInTheDocument();
    expect(screen.getByText("12 dars")).toBeInTheDocument();
  });

  it("renders course image with alt text", () => {
    render(<CourseCard course={course} />);
    const img = screen.getByAltText("Moda illyustratsiyasi");
    expect(img).toHaveAttribute("src", "http://img/course.png");
  });
});
