'use client'

import React from 'react'
import Link from 'next/link'
import { Breadcrumb } from 'antd'         // adjust if you use a different UI lib

const items = [
  {
    path: 'index',
    title: 'home',
  },
  {
    path: 'first',
    title: 'first',
    children: [
      { path: 'general', title: 'General' },
      { path: 'layout', title: 'Layout' },
      { path: 'navigation', title: 'Navigation' },
    ],
  },
  {
    path: 'second',
    title: 'second',
  },
]

function itemRender(currentRoute, params, routes, paths) {
  const isLast = currentRoute?.path === (routes?.[routes.length - 1]?.path ?? null)

  return isLast ? (
    <span>{currentRoute.title}</span>
  ) : (
    <Link href={`/${paths.join('/')}`}>{currentRoute.title}</Link>
  )
}


const BreadcrumbEl = () => <Breadcrumb itemRender={itemRender} items={items} />

export default BreadcrumbEl