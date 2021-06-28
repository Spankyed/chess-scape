//TODO: refactor references to BABYLON.Utilities to Utilities

export class Utilities {
    static get UpVector() { return BABYLON.Vector3.Up() }
    static get ZeroVector() { return BABYLON.Vector3.Zero() }
    static get TempMatrix() { return BABYLON.Matrix.Zero() }
    static get TempVector2() { return BABYLON.Vector2.Zero() }
    static get TempVector3() { return BABYLON.Vector3.Zero() }
    static get PrintElement() { return null }

    static Angle(from, to) {
        return Math.acos(BABYLON.Scalar.Clamp(BABYLON.Vector3.Dot(from.normalize(), to.normalize()), -1, 1)) * 57.29578;
    }

    static ClampAngle(angle, min, max) {
        let result = angle;
        do {
            if (result < -360) {
                result += 360;
            }
            if (result > 360) {
                result -= 360;
            }
        } while (result < -360 || result > 360)
        return BABYLON.Scalar.Clamp(result, min, max);
    }
    /** Returns a new radion converted from degree */
    static Deg2Rad(degree) {
        return degree * BABYLON.Constants.Deg2Rad;
    }
    /** Returns a new degree converted from radion */
    static Rad2Deg(radion) {
        return radion * BABYLON.Constants.Rad2Deg;
    }
    /** Returns a new Quaternion set from the passed Euler float angles (x, y, z). */
    static Euler(eulerX, eulerY, eulerZ)  {
        return BABYLON.Quaternion.RotationYawPitchRoll(eulerY, eulerX, eulerZ);
    }
    /** Returns a new Quaternion set from the passed Euler float angles (x, y, z). */
    static EulerToRef(eulerX, eulerY, eulerZ, result)  {
        BABYLON.Quaternion.RotationYawPitchRollToRef(eulerY, eulerX, eulerZ, result);
    }
    /** Returns a new Matrix as a rotation matrix from the Euler angles (x, y, z). */
    static Matrix(eulerX, eulerY, eulerZ) {
        return BABYLON.Matrix.RotationYawPitchRoll(eulerY, eulerX, eulerZ);
    }
    /** Returns a new Matrix as a rotation matrix from the Euler angles (x, y, z). */
    static MatrixToRef(eulerX, eulerY, eulerZ, result) {
        BABYLON.Matrix.RotationYawPitchRollToRef(eulerY, eulerX, eulerZ, result);
    }
    /** Multplies a quaternion by a vector (rotates vector) */
    static RotateVector(vec, quat) {
        let tx = 2 * (quat.y * vec.z - quat.z * vec.y);
        let ty = 2 * (quat.z * vec.x - quat.x * vec.z);
        let tz = 2 * (quat.x * vec.y - quat.y * vec.x);
        return new BABYLON.Vector3(vec.x + quat.w * tx + (quat.y * tz - quat.z * ty), vec.y + quat.w * ty + (quat.z * tx - quat.x * tz), vec.z + quat.w * tz + (quat.x * ty - quat.y * tx));
    }
    /** Multplies a quaternion by a vector (rotates vector) */
    static RotateVectorToRef(vec, quat, result) {
        let tx = 2 * (quat.y * vec.z - quat.z * vec.y);
        let ty = 2 * (quat.z * vec.x - quat.x * vec.z);
        let tz = 2 * (quat.x * vec.y - quat.y * vec.x);
        result.x = vec.x + quat.w * tx + (quat.y * tz - quat.z * ty);
        result.y = vec.y + quat.w * ty + (quat.z * tx - quat.x * tz);
        result.z = vec.z + quat.w * tz + (quat.x * ty - quat.y * tx);
    }
    /** Returns a new Quaternion set from the passed vector position. */
    static LookRotation(position) {
        let result = BABYLON.Quaternion.Zero();
        BABYLON.Utilities.LookRotationToRef(position, result);
        return result;
    }
    /** Returns a new Quaternion set from the passed vector position. */
    static LookRotationToRef(position, result) {
        BABYLON.Utilities.TempMatrix.reset();
        BABYLON.Matrix.LookAtLHToRef(BABYLON.Utilities.ZeroVector, position, BABYLON.Utilities.UpVector, BABYLON.Utilities.TempMatrix)
        BABYLON.Utilities.TempMatrix.invert()
        BABYLON.Quaternion.FromRotationMatrixToRef(BABYLON.Utilities.TempMatrix, result);
    }
    /** Resets the physics parent and positioning */
    static ResetPhysicsPosition(position, parent) {
        let check = parent;
        if (check.position) {
            position.addInPlace(check.position);
        }
        if (check.parent != null) {
            BABYLON.Utilities.ResetPhysicsPosition(position, check.parent);
        }
    }

    // *********************************** //
    // * Public Print To Screen Support  * //
    // *********************************** //

    static PrintToScreen(text, color = "white") {
        BABYLON.Utilities.PrintElement = document.getElementById("print");
        if (BABYLON.Utilities.PrintElement == null) {
            let printer = document.createElement("div");
            printer.id = "print";
            printer.style.position = "absolute";
            printer.style.left = "6px";
            printer.style.bottom = "3px";
            printer.style.fontSize = "12px";
            printer.style.zIndex = "10000";
            printer.style.color = "#0c0";
            document.body.appendChild(printer);
            BABYLON.Utilities.PrintElement = printer;
        }
        if (BABYLON.Utilities.PrintElement != null && BABYLON.Utilities.PrintElement.innerHTML !== text) {
            if (BABYLON.Utilities.PrintElement.style.color !== color) BABYLON.Utilities.PrintElement.style.color = color;
            BABYLON.Utilities.PrintElement.innerHTML = text;
        }
    }
    
    // *********************************** //
    // *  Scene Transform Tools Support  * //
    // *********************************** //
    
    /** Transforms position from local space to world space. */
    static TransformPosition(owner, position) {
        return BABYLON.Vector3.TransformCoordinates(position, owner.getWorldMatrix());
    }
    /** Transforms position from local space to world space. */
    static TransformPositionToRef(owner, position, result) {
        return BABYLON.Vector3.TransformCoordinatesToRef(position, owner.getWorldMatrix(), result);
    }
    /** Transforms direction from local space to world space. */
    static TransformDirection(owner, direction) {
        return BABYLON.Vector3.TransformNormal(direction, owner.getWorldMatrix());
    }
    /** Transforms direction from local space to world space. */
    static TransformDirectionToRef(owner, direction, result) {
        return BABYLON.Vector3.TransformNormalToRef(direction, owner.getWorldMatrix(), result);
    }
    /** Recomputes the meshes bounding center pivot point */
    static RecomputePivotPoint(owner) {
        var boundingCenter = owner.getBoundingInfo().boundingSphere.center;
        owner.setPivotMatrix(BABYLON.Matrix.Translation(-boundingCenter.x, -boundingCenter.y, -boundingCenter.z));
    }      
        
    // ************************************ //
    // *  Scene Direction Helper Support  * //
    // ************************************ //

    /** Gets any direction vector of the owner in world space. */
    static GetDirectionVector(owner, vector) {
        return owner.getDirection(vector);
    }
    /** Gets any direction vector of the owner in world space. */
    static GetDirectionVectorToRef(owner, vector, result) {
        owner.getDirectionToRef(vector, result);
    }
    /** Gets the blue axis of the owner in world space. */
    static GetForwardVector(owner) {
        return owner.getDirection(BABYLON.Vector3.Forward());
    }
    /** Gets the blue axis of the owner in world space. */
    static GetForwardVectorToRef(owner, result) {
        owner.getDirectionToRef(BABYLON.Vector3.Forward(), result);
    }
    /** Gets the red axis of the owner in world space. */
    static GetRightVector(owner) {
        return owner.getDirection(BABYLON.Vector3.Right());
    }
    /** Gets the red axis of the owner in world space. */
    static GetRightVectorToRef(owner, result) {
        owner.getDirectionToRef(BABYLON.Vector3.Right(), result);
    }
    /** Gets the green axis of the owner in world space. */
    static GetUpVector(owner) {
        return owner.getDirection(BABYLON.Vector3.Up());
    }
    /** Gets the green axis of the owner in world space. */
    static GetUpVectorToRef(owner, result) {
        owner.getDirectionToRef(BABYLON.Vector3.Up(), result);
    }
    
    // *********************************** //
    // *   Public Parse Tools Support    * //
    // *********************************** //

    static ParseColor3(source, defaultValue = null) {
        let result = null
        if (source != null && source.r != null && source.g != null&& source.b != null) {
            result = new BABYLON.Color3(source.r, source.g, source.b);
        } else {
            result = defaultValue;
        }
        return result;
    }

    static ParseColor4(source, defaultValue = null) {
        let result = null
        if (source != null && source.r != null && source.g != null && source.b != null && source.a != null) {
            result = new BABYLON.Color4(source.r, source.g, source.b, source.a);
        } else {
            result = defaultValue;
        }
        return result;
    }
    
    static ParseVector2(source, defaultValue = null) {
        let result = null
        if (source != null && source.x != null && source.y != null) {
            result = new BABYLON.Vector2(source.x, source.y);
        } else {
            result = defaultValue;
        }
        return result;
    }

    static ParseVector3(source, defaultValue = null) {
        let result = null
        if (source != null && source.x != null && source.y != null && source.z != null) {
            result = new BABYLON.Vector3(source.x, source.y, source.z);
        } else  {
            result = defaultValue;
        }
        return result;
    }

    static ParseVector4(source, defaultValue = null) {
        let result = null
        if (source != null && source.x != null && source.y != null && source.z != null && source.w != null) {
            result = new BABYLON.Vector4(source.x, source.y, source.z, source.w);
        } else {
            result = defaultValue;
        }
        return result;
    }
    
    static ParseTransform(source, defaultValue = null) {
        return null; // TODO: Support Transform Serialization
    }
    
    // ************************************ //
    // * Public String Tools Support * //
    // ************************************ //

    static StartsWith(source, word) {
        return source.lastIndexOf(word, 0) === 0;
    }

    static EndsWith(source, word) {
        return source.indexOf(word, source.length - word.length) !== -1;
    }
    
    static ReplaceAll(source, word, replace) {
        return source.replace(new RegExp(word, 'g'), replace);            
    }
    
    // ************************************ //
    // *  Scene Animation Sampling Tools  * //
    // ************************************ //
    
    /** Set the passed matrix "result" as the sampled key frame value for the specfied animation track. */
    static SampleAnimationMatrix(animation, frame, loopMode, result) {
        if (animation != null && animation.dataType === BABYLON.Animation.ANIMATIONTYPE_MATRIX) {
            let keys = animation.getKeys();
            if (frame < keys[0].frame) {
                frame = keys[0].frame;
            } else if (frame > keys[keys.length - 1].frame) {
                frame = keys[keys.length - 1].frame;
            }
            BABYLON.Utilities.FastMatrixInterpolate(animation, frame, loopMode, result);
        }
    }
    /** Gets the float "result" as the sampled key frame value for the specfied animation track. */
    static SampleAnimationFloat(animation, frame, repeatCount, loopMode, offsetValue = null, highLimitValue = null) {
        let result = 0;
        if (animation != null && animation.dataType === BABYLON.Animation.ANIMATIONTYPE_FLOAT) {
            let keys = animation.getKeys();
            if (frame < keys[0].frame) {
                frame = keys[0].frame;
            } else if (frame > keys[keys.length - 1].frame) {
                frame = keys[keys.length - 1].frame;
            }
            result = BABYLON.Utilities.FastFloatInterpolate(animation, frame, repeatCount, loopMode, offsetValue, highLimitValue);
        }
        return result;
    }
    /** Set the passed matrix "result" as the interpolated values for "gradient" (float) between the ones of the matrices "startValue" and "endValue". */
    static FastMatrixLerp(startValue, endValue, gradient, result) {
        BABYLON.Matrix.LerpToRef(startValue, endValue, gradient, result);
    }
    /** Set the passed matrix "result" as the spherical interpolated values for "gradient" (float) between the ones of the matrices "startValue" and "endValue". */
    static FastMatrixSlerp(startValue, endValue, gradient, result) {
        BABYLON.Matrix.DecomposeLerpToRef(startValue, endValue, gradient, result);
    }
    /** Set the passed matrix "result" as the interpolated values for animation key frame sampling. */
    static FastMatrixInterpolate(animation, currentFrame, loopMode, result) {
        let keys = animation.getKeys();
        let startKeyIndex = Math.max(0, Math.min(keys.length - 1, Math.floor(keys.length * (currentFrame - keys[0].frame) / (keys[keys.length - 1].frame - keys[0].frame)) - 1));
        if (keys[startKeyIndex].frame >= currentFrame) {
            while (startKeyIndex - 1 >= 0 && keys[startKeyIndex].frame >= currentFrame) {
                startKeyIndex--;
            }
        }
        for (let key = startKeyIndex; key < keys.length; key++) {
            let endKey = keys[key + 1];
            if (endKey.frame >= currentFrame) {
                let startKey = keys[key];
                let startValue = startKey.value;
                if (startKey.interpolation === AnimationKeyInterpolation.STEP) {
                    result.copyFrom(startValue);
                    return;
                }
                let endValue = endKey.value;
                let useTangent = startKey.outTangent !== undefined && endKey.inTangent !== undefined;
                let frameDelta = endKey.frame - startKey.frame;
                // Gradient : percent of currentFrame between the frame inf and the frame sup
                let gradient = (currentFrame - startKey.frame) / frameDelta;
                // Check for easingFunction and correction of gradient
                let easingFunction = animation.getEasingFunction();
                if (easingFunction != null) {
                    gradient = easingFunction.ease(gradient);
                }
                // Switch anmimation matrix type
                switch (loopMode) {
                    case Animation.ANIMATIONLOOPMODE_CYCLE:
                    case Animation.ANIMATIONLOOPMODE_CONSTANT:
                        BABYLON.Utilities.FastMatrixSlerp(startValue, endValue, gradient, result);
                        return;
                    case Animation.ANIMATIONLOOPMODE_RELATIVE:
                        result.copyFrom(startValue);
                        return;
                }
                break;
            }
        }
        result.copyFrom(keys[keys.length - 1].value);
    }
    /** Returns float result as the interpolated values for animation key frame sampling. */
    static FastFloatInterpolate(animation, currentFrame, repeatCount, loopMode, offsetValue = null, highLimitValue = null) {
        if (loopMode === Animation.ANIMATIONLOOPMODE_CONSTANT && repeatCount > 0) {
            return highLimitValue.clone ? highLimitValue.clone() : highLimitValue;
        }
        let keys = animation.getKeys();
        let startKeyIndex = Math.max(0, Math.min(keys.length - 1, Math.floor(keys.length * (currentFrame - keys[0].frame) / (keys[keys.length - 1].frame - keys[0].frame)) - 1));
        if (keys[startKeyIndex].frame >= currentFrame) {
            while (startKeyIndex - 1 >= 0 && keys[startKeyIndex].frame >= currentFrame) {
                startKeyIndex--;
            }
        }
        for (let key = startKeyIndex; key < keys.length; key++) {
            let endKey = keys[key + 1];
            if (endKey.frame >= currentFrame) {
                let startKey = keys[key];
                let startValue = startKey.value;
                if (startKey.interpolation === AnimationKeyInterpolation.STEP) {
                    return startValue;
                }
                let endValue = endKey.value;
                let useTangent = startKey.outTangent !== undefined && endKey.inTangent !== undefined;
                let frameDelta = endKey.frame - startKey.frame;
                // Gradient : percent of currentFrame between the frame inf and the frame sup
                let gradient = (currentFrame - startKey.frame) / frameDelta;
                // Check for easingFunction and correction of gradient
                let easingFunction = animation.getEasingFunction();
                if (easingFunction != null) {
                    gradient = easingFunction.ease(gradient);
                }
                // Switch anmimation float type
                let floatValue = useTangent ? animation.floatInterpolateFunctionWithTangents(startValue, startKey.outTangent * frameDelta, endValue, endKey.inTangent * frameDelta, gradient) : animation.floatInterpolateFunction(startValue, endValue, gradient);
                switch (loopMode) {
                    case Animation.ANIMATIONLOOPMODE_CYCLE:
                    case Animation.ANIMATIONLOOPMODE_CONSTANT:
                        return floatValue;
                    case Animation.ANIMATIONLOOPMODE_RELATIVE:
                        return offsetValue * repeatCount + floatValue;
                }
                break;
            }
        }
        return keys[keys.length - 1].value;
    }

    // ********************************** //
    // * Public Blending Speed Support  * //
    // ********************************** //

    /** Computes the transition duration blending speed */
    static ComputeBlendingSpeed(rate, duration) {
        return 1 / (rate * duration);
    }

    // ************************************ //
    // * Public Scene Component Register  * //
    // ************************************ //

    /** Registers A scene component on the scene */
    static RegisterSceneComponent(comp, klass, enableUpdate = true, propertyBag = {}) {
        let owner = (comp).entity;
        if (owner == null) throw new Error("Null owner scene object attached");
        if (owner.metadata == null || !owner.metadata.api) {
            let metadata = {
                api: true,
                type: "Babylon",
                parsed: false,
                prefab: false,
                state: {},
                objectName: "Scene Component",
                objectId: "0",
                tagName: "Untagged",
                layerIndex: 0,
                layerName: "Default",
                areaIndex: -1,
                navAgent: null,
                meshLink: null,
                meshObstacle: null,
                shadowCastingMode: 0,
                socketList: [],
                animationClips: [],
                animationEvents: [],
                collisionEvent: null,
                components: [],
                properties: {}
            };
            owner.metadata = metadata;
        }
        if (owner.metadata != null && owner.metadata.api) {
            let metadata = owner.metadata;
            if (metadata.components == null) {
                metadata.components = [];
            }
            if (metadata.components != null) {
                let compscript = {
                    order: 1000,
                    name: "EditorScriptComponent",
                    klass: klass,
                    update: enableUpdate,
                    properties: propertyBag,
                    instance: comp,
                    tag: {}
                };
                metadata.components.push(compscript);
                comp.register();
                // ..
                // Fire Component Ready
                // ..
                if ((comp).ready != null) {
                    (comp).ready();
                } else {
                    BABYLON.Tools.Error("No component ready function detected.");
                }
            } else {
                BABYLON.Tools.Error("Failed to parse metadata components");
            }
        } else {
            BABYLON.Tools.Error("Null owner object metadata");
        }
    }

    // ********************************** //
    // * Public Scene Manager Register  * //
    // ********************************** //

    /** Registers new manager instance on the scene object */
    static RegisterSceneManager(scene)  {
        let scenex = scene;
        if (scenex.manager != null) {
            scenex.manager.dispose();
            scenex.manager = null;
        }                
        scenex.manager = new BABYLON.SceneManager(scene);
        return scenex.manager;
    }
    /** Parses the registered scene manager object metadata */
    static ParseSceneMetadata(scene) {
        let scenex = scene;
        if (scenex.manager != null) {
            scenex.manager._parseSceneMetadata();
        } else {
            BABYLON.Tools.Warn("Babylon.js no scene manager instance detected. Failed to parse scene metadata.");
        }
    }
    /** Parses the registered scene manager import metadata */
    static ParseImportMetadata(meshes, scene) {
        let scenex = scene;
        if (scenex.manager != null) {
            let manager = scenex.manager;
            let ticklist  = [];
            (BABYLON.SceneManager).parseSceneMeshes(meshes, scene, ticklist);
            if (ticklist.length > 0) {
                ticklist.sort((left, right) => {
                    if (left.order < right.order) return -1;
                    if (left.order > right.order) return 1;
                    return 0;
                });
                ticklist.forEach((scriptComponent) => {
                    scriptComponent.instance.register();
                });
            }
        } else {
            BABYLON.Tools.Warn("Babylon.js no scene manager instance detected. Failed to parse scene metadata.");
        }
    }
    /** Fire the manager instance internal scene ready function */
    static ExecuteSceneReady(scene) {
        let scenex = scene;
        if (scenex.manager != null) {
            scenex.manager._executeWhenReady();
        } else {
            BABYLON.Tools.Warn("Babylon.js no scene manager instance detected. Failed to execute scene ready.");
        }
    }
}
