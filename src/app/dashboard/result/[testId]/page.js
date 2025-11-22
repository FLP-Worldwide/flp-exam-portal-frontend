"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ResultModule() {
  const { testId } = useParams();
  const router = useRouter();

  return (
    <>
        Result Comming Soon
    </>
  );
}