import { expect, test } from "vitest"
import { canvasColor, fitCanvas, MAX_ZOOM, MIN_ZOOM, zoomCanvas } from "./canvas"

test("canvasColor maps presets and passes hex through", () => {
  expect(canvasColor("1")).toBe("#fb464c")
  expect(canvasColor("#123456")).toBe("#123456")
  expect(canvasColor(undefined)).toBeUndefined()
})

test("fitCanvas centers the bounds without zooming past 100%", () => {
  expect(fitCanvas({ x: 0, y: 0, width: 100, height: 50 }, 1000, 500)).toEqual({ x: 450, y: 225, scale: 1 })
  expect(fitCanvas({ x: -100, y: 0, width: 2000, height: 100 }, 1096, 600)).toEqual({ x: 48, y: 275, scale: 0.5 })
  expect(fitCanvas({ x: 0, y: 0, width: 0, height: 0 }, 400, 200)).toEqual({ x: 200, y: 100, scale: 1 })
  expect(fitCanvas({ x: 0, y: 0, width: 1e6, height: 1e6 }, 400, 200).scale).toBe(MIN_ZOOM)
})

test("zoomCanvas keeps the origin point fixed and clamps the scale", () => {
  const view = zoomCanvas({ x: 0, y: 0, scale: 1 }, 2, 100, 100)
  expect(view).toEqual({ x: -100, y: -100, scale: 2 })
  // The canvas point under (100, 100) stays the same: (100 - x) / scale.
  expect((100 - view.x) / view.scale).toBe(100)
  expect(zoomCanvas({ x: 0, y: 0, scale: 3 }, 10, 0, 0).scale).toBe(MAX_ZOOM)
  expect(zoomCanvas({ x: 0, y: 0, scale: 0.2 }, 0.01, 0, 0).scale).toBe(MIN_ZOOM)
})
