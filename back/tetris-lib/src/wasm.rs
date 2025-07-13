use serde_wasm_bindgen::from_value;
use serde_wasm_bindgen::to_value;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::*;

use crate::Board;
use crate::FallingBlockPlan;
use crate::MoveDirection;
use crate::RotateDirection;
use crate::Tetrimino;
use crate::Tile;
use crate::TileAt;

#[wasm_bindgen]
pub struct JsBoard {
    inner: Board,
}

#[wasm_bindgen]
impl JsBoard {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize) -> Self {
        Self {
            inner: Board::new(width, height),
        }
    }

    #[wasm_bindgen(getter)]
    #[wasm_bindgen(js_name = xLen)]
    pub fn x_len(&self) -> usize {
        self.inner.x_len()
    }

    #[wasm_bindgen(getter)]
    #[wasm_bindgen(js_name = yLen)]
    pub fn y_len(&self) -> usize {
        self.inner.y_len()
    }

    #[wasm_bindgen(js_name = setLocation)]
    pub fn set_location(&mut self, x: usize, y: usize, tile: JsValue) -> Result<(), JsValue> {
        Ok(*self.inner.location_mut(x, y) = from_value::<Tile>(tile)?)
    }

    #[wasm_bindgen(js_name = getLocation)]
    pub fn get_location(&self, x: usize, y: usize) -> Result<JsValue, JsValue> {
        Ok(to_value(self.inner.location(x, y))?)
    }

    #[wasm_bindgen(js_name = getBoard)]
    pub fn get_board(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(self.inner.board())?)
    }

    #[wasm_bindgen(js_name = getLine)]
    pub fn get_line(&self, y: usize) -> Result<JsValue, JsValue> {
        Ok(to_value(self.inner.line(y))?)
    }

    #[wasm_bindgen(js_name = trySpawnFalling)]
    pub fn try_spawn_falling(&self, tetrimino: JsValue) -> Result<JsValue, JsValue> {
        let tetrimino = from_value::<Tetrimino>(tetrimino)?;
        match self.inner.try_spawn_falling(tetrimino) {
            Ok(res) => Ok(to_value(&res)?),
            Err(err) => Err(to_value(&err)?),
        }
    }

    #[wasm_bindgen(js_name = trySpawnFallingAt)]
    pub fn try_spawn_falling_at(
        &self,
        tetrimino: JsValue,
        x: usize,
        y: usize,
    ) -> Result<JsValue, JsValue> {
        let tetrimino = from_value::<Tetrimino>(tetrimino)?;
        match self.inner.try_spawn_falling_at(tetrimino, x, y) {
            Ok(res) => Ok(to_value(&res)?),
            Err(err) => Err(to_value(&err)?),
        }
    }

    #[wasm_bindgen(js_name = applySpawnFalling)]
    pub fn apply_spawn_falling(&mut self, tiles: JsValue) -> Result<(), JsValue> {
        let tiles = from_value::<Vec<TileAt>>(tiles)?;
        Ok(self.inner.apply_spawn_falling(tiles))
    }

    #[wasm_bindgen(js_name = getFallingBlocks)]
    pub fn get_falling_blocks(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.inner.get_falling_blocks())?)
    }

    #[wasm_bindgen(js_name = tryMoveFalling)]
    pub fn try_move_falling(&self, dir: JsValue) -> Result<JsValue, JsValue> {
        let dir = from_value::<MoveDirection>(dir)?;
        match self.inner.try_move_falling(dir) {
            Ok(res) => Ok(to_value(&res)?),
            Err(err) => Err(to_value(&err)?),
        }
    }

    #[wasm_bindgen(js_name = applyMoveFalling)]
    pub fn apply_move_falling(&mut self, fallings: JsValue) -> Result<(), JsValue> {
        let tiles = from_value::<Vec<FallingBlockPlan>>(fallings)?;
        Ok(self.inner.apply_move_falling(tiles))
    }

    #[wasm_bindgen(js_name = tryRotateFalling)]
    pub fn try_rotate_falling(&self, dir: JsValue) -> Result<JsValue, JsValue> {
        let dir = from_value::<RotateDirection>(dir)?;
        match self.inner.try_rotate_falling(dir) {
            Ok(res) => Ok(to_value(&res)?),
            Err(err) => Err(to_value(&err)?),
        }
    }

    #[wasm_bindgen(js_name = applyRotateFalling)]
    pub fn apply_rotate_falling(&mut self, fallings: JsValue) -> Result<(), JsValue> {
        let tiles = from_value::<Vec<FallingBlockPlan>>(fallings)?;
        Ok(self.inner.apply_rotate_falling(tiles))
    }

    #[wasm_bindgen(js_name = tryStep)]
    pub fn try_step(&self) -> Result<JsValue, JsValue> {
        match self.inner.try_step() {
            Ok(res) => Ok(to_value(&res)?),
            Err(err) => Err(to_value(&err)?),
        }
    }

    #[wasm_bindgen(js_name = applyStep)]
    pub fn apply_step(&mut self, fallings: JsValue) -> Result<(), JsValue> {
        let tiles = from_value::<Vec<FallingBlockPlan>>(fallings)?;
        Ok(self.inner.apply_step(tiles))
    }

    #[wasm_bindgen(js_name = placeFalling)]
    pub fn place_falling(&mut self) -> Result<(), JsValue> {
        Ok(self.inner.place_falling())
    }

    #[wasm_bindgen(js_name = tryLineClear)]
    pub fn try_line_clear(&self) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.inner.try_line_clear())?)
    }

    #[wasm_bindgen(js_name = applyLineClear)]
    pub fn apply_line_clear(&mut self, to_clear_lines: JsValue) -> Result<(), JsValue> {
        let to_clear_lines = from_value::<Vec<usize>>(to_clear_lines)?;
        Ok(self.inner.apply_line_clear(to_clear_lines))
    }

    #[wasm_bindgen(js_name = hardDrop)]
    pub fn hard_drop(&mut self) -> usize {
        self.inner.hard_drop() as usize
    }

    #[wasm_bindgen(js_name = showFallingHint)]
    pub fn show_falling_hint(&mut self) {
        self.inner.show_falling_hint()
    }

    #[wasm_bindgen(js_name = removeFallingHint)]
    pub fn remove_falling_hint(&mut self) {
        self.inner.remove_falling_hint()
    }

    #[wasm_bindgen(js_name = hasPlacedAbove)]
    pub fn has_placed_above(&mut self, y: usize) -> Result<JsValue, JsValue> {
        Ok(to_value(&self.inner.has_placed_above(y))?)
    }

    #[wasm_bindgen(js_name = removeFallingBlocks)]
    pub fn remove_falling_blocks(&mut self) {
        self.inner.remove_falling_blocks();
    }
}
