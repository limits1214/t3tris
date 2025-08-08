import { Text } from "troika-three-text";
import * as THREE from "three";
import type { TetrisIMesh, TetrisIMeshInfo, TetrisIMeshObject } from "./type";
import { CONSTANT } from "./constant";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

export class GameRender {
  // prettier-ignore
  private instancedMeshInfos: Record<TetrisIMesh, TetrisIMeshInfo> = {
    Cover: { isDirty: false, objects: [] },
    EndCover: { isDirty: false, objects: [] },
    Case: { isDirty: false, objects: [] },
    Grid: { isDirty: false, objects: [] },
    Hint: { isDirty: false, objects: [] },
    Next: { isDirty: false, objects: [] },
    Hold: { isDirty: false, objects: [] },
    GarbageQueue: { isDirty: false, objects: [] },
    GarbageReady: { isDirty: false, objects: [] },
    Garbage: { isDirty: false, objects: [] },
    I: { isDirty: false, objects: [] },
    O: { isDirty: false, objects: [] },
    T: { isDirty: false, objects: [] },
    J: { isDirty: false, objects: [] },
    L: { isDirty: false, objects: [] },
    S: { isDirty: false, objects: [] },
    Z: { isDirty: false, objects: [] },
  };
  private boxGeo = new THREE.BoxGeometry();
  private basicMat = new THREE.MeshBasicMaterial();
  // prettier-ignore
  private instancedMeshs: Record<TetrisIMesh, THREE.InstancedMesh> = {
    Cover:        new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    EndCover:     new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    Case:         new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    Grid:         new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    Hint:         new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    Next:         new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    Hold:         new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    GarbageQueue: new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    GarbageReady: new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    Garbage:      new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    I:            new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    O:            new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    T:            new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    J:            new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    L:            new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    S:            new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
    Z:            new THREE.InstancedMesh(this.boxGeo, this.basicMat, CONSTANT.gfx.instancedMeshReserve,),
  };

  private planeGeo = new THREE.PlaneGeometry();
  private scene: THREE.Scene | undefined;
  private textMat = new THREE.MeshBasicMaterial({
    color: "black",
    side: THREE.DoubleSide,
  });

  private texts: Partial<Record<string, Text>> = {};

  public init({
    tetriminoGeo,
    scene,
    font3d,
  }: {
    tetriminoGeo: THREE.BufferGeometry;
    scene: THREE.Scene;
    font3d: Font;
  }) {
    this.scene = scene;

    const im = this.instancedMeshs;

    im.Case.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.Case);

    im.Cover.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.Cover, {
      opacity: 0.7,
      transparent: true,
    });

    im.EndCover.material = this.makeLambertMat(
      CONSTANT.gfx.color.mesh.EndCover,
      {
        opacity: 0.7,
        transparent: true,
      }
    );

    im.Next.geometry = new TextGeometry("NEXT", {
      font: font3d,
      size: CONSTANT.gfx.font3d.size,
      depth: CONSTANT.gfx.font3d.depth,
    });
    im.Next.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.Next);

    im.Hold.geometry = new TextGeometry("HOLD", {
      font: font3d,
      size: CONSTANT.gfx.font3d.size,
      depth: CONSTANT.gfx.font3d.depth,
    });
    im.Hold.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.Hold);

    im.Grid.geometry = this.planeGeo;
    im.Grid.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.Grid);

    im.GarbageQueue.geometry = tetriminoGeo;
    im.GarbageQueue.material = this.makeLambertMat(
      CONSTANT.gfx.color.mesh.GarbageQueue
    );

    im.GarbageReady.geometry = tetriminoGeo;
    im.GarbageReady.material = this.makeLambertMat(
      CONSTANT.gfx.color.mesh.GarbageReady
    );

    im.Garbage.geometry = tetriminoGeo;
    im.Garbage.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.Garbage);

    im.Hint.geometry = tetriminoGeo;
    im.Hint.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.Hint, {
      opacity: 0.7,
      transparent: true,
    });
    im.Hint.renderOrder = 999;

    im.I.geometry = tetriminoGeo;
    im.I.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.I);

    im.O.geometry = tetriminoGeo;
    im.O.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.O);

    im.T.geometry = tetriminoGeo;
    im.T.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.T);

    im.J.geometry = tetriminoGeo;
    im.J.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.J);

    im.L.geometry = tetriminoGeo;
    im.L.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.L);

    im.S.geometry = tetriminoGeo;
    im.S.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.S);

    im.Z.geometry = tetriminoGeo;
    im.Z.material = this.makeLambertMat(CONSTANT.gfx.color.mesh.Z);

    for (const [, imesh] of Object.entries(this.instancedMeshs)) {
      imesh.count = 0;
      imesh.frustumCulled = false;
      this.scene.add(imesh);
    }
  }
  private makeLambertMat(
    color: string,
    opt?: { opacity: number; transparent: boolean }
  ) {
    return new THREE.MeshLambertMaterial({ color, ...opt });
  }

  /**
   *
   */
  public updateInstancedMeshs() {
    // const dummy = new THREE.Object3D();
    const entries = Object.entries(this.instancedMeshInfos) as [
      TetrisIMesh,
      TetrisIMeshInfo
    ][];

    entries.forEach(([mType, mInfos]) => {
      if (mInfos.isDirty) {
        mInfos.objects.forEach(({ object }, idx) => {
          object.updateMatrix();
          this.instancedMeshs[mType].setMatrixAt(idx, object.matrix);
        });
        this.instancedMeshs[mType].count = mInfos.objects.length;
        this.instancedMeshs[mType].instanceMatrix.needsUpdate = true;
        mInfos.isDirty = false;
      }
    });
  }

  public pushInstancedMeshInfo(mType: TetrisIMesh, object: TetrisIMeshObject) {
    this.instancedMeshInfos[mType].isDirty = true;
    this.instancedMeshInfos[mType].objects.push(object);
  }

  public updateInstancedMeshInfo(
    mType: TetrisIMesh,
    id: string,
    object: THREE.Object3D
  ) {
    for (const target of this.instancedMeshInfos[mType].objects) {
      if (target.id === id) {
        this.instancedMeshInfos[mType].isDirty = true;
        target.object = object;
      }
    }
  }

  public updateInstancedMeshInfos(
    mType: TetrisIMesh,
    filterId: string,
    objects: TetrisIMeshObject[]
  ) {
    this.removeInstancedMeshInfoByFilterId(mType, filterId);
    const newArr = [...this.instancedMeshInfos[mType].objects, ...objects];
    this.instancedMeshInfos[mType].objects = newArr;
    this.instancedMeshInfos[mType].isDirty = true;
  }

  public removeInstancedMeshInfoByFilterId(
    mType: TetrisIMesh,
    filterId: string
  ) {
    const filteredArr = this.instancedMeshInfos[mType].objects.filter((f) => {
      return !f.id.includes(filterId);
    });
    this.instancedMeshInfos[mType].objects = filteredArr;
    this.instancedMeshInfos[mType].isDirty = true;
  }

  public addText(id: string, txt: string, object: THREE.Object3D) {
    const text = new Text();
    text.text = `${txt}`;
    text.fontSize = 1;
    text.position.copy(object.position);
    text.rotation.copy(object.rotation);
    text.scale.copy(object.scale);
    text.anchorX = "center";
    text.anchorY = "middle";
    text.material = this.textMat;
    this.scene?.add(text);
    text.sync();
    this.texts[id] = text;
  }

  public removeText(id: string) {
    const text = this.texts[id];
    if (text) {
      this.scene?.remove(text);
      text.geometry.dispose();
      if (Array.isArray(text.material)) {
        text.material.forEach((m) => m.dispose());
      } else {
        text.material.dispose();
      }
    }
  }

  public updateText(id: string, txt: string) {
    const text = this.texts[id];
    if (text) {
      const beforeTxt = text.text;
      if (beforeTxt !== txt) {
        text.text = txt;
      }
    }
  }

  public destroy() {
    for (const [, im] of Object.entries(this.instancedMeshs)) {
      if (!im) continue;
      this.scene?.remove(im);
      im.geometry.dispose();
      if (Array.isArray(im.material)) {
        im.material.forEach((m) => m.dispose());
      } else {
        im.material.dispose();
      }
    }
  }
}
