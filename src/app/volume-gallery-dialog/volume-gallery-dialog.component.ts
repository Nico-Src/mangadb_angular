import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { TuiButton, TuiAppearance, TuiLoader, TuiAlertService, TuiTextfield } from '@taiga-ui/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { errorAlert, successAlert, getTranslation, CDN_BASE } from '../../globals';
import { TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { TuiSegmented, TuiSlider } from '@taiga-ui/kit';
import { MangaCover } from '../manga-cover/manga-cover.component';
import * as THREE from 'three';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { tablerX } from '@ng-icons/tabler-icons';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'volume-gallery-dialog',
    imports: [ TranslatePipe, MangaCover, TuiButton, NgIcon, TuiSegmented, TuiLoader, TuiSlider, NgIf, NgFor, ReactiveFormsModule, FormsModule, TuiTextfield, TuiSelectModule, TuiTextfieldControllerModule],
    templateUrl: './volume-gallery-dialog.component.html',
    styleUrl: './volume-gallery-dialog.component.less',
    viewProviders:[provideIcons({ tablerX })]
})
export class VolumeGalleryDialog {
    private readonly alerts = inject(TuiAlertService);
    private readonly auth = inject(AuthService);
    constructor(private translate: TranslateService, private el: ElementRef){}
    @Input() volume: any = null;
    show: boolean = false;
    tabIndex: number = 0;
    threeD: boolean = false;
    threeDInitalized: boolean = false;
    viewer: any = {mouse:{}};
    viewerLoading: boolean = false;

    public allowedToView3D: boolean = false;

    @ViewChild('window') window: any;
    @ViewChild('viewerRef') viewerRef: any;

    ngOnChanges(){
        if(!this.volume) return;
        // reset 3d and recheck if 3d is available
        this.reset3D();
        this.threeD = !(!this.volume.measures || this.volume.measures?.trim() === "" || this.volume.measures === "-");

        // check if user can view 3d (based on age verification and volume nsfw status)
        const loggedIn = this.auth.isLoggedIn();
        const user = this.auth.getUser();
        if(!loggedIn && (this.volume.nsfw || this.volume.nsfw18)){
            this.allowedToView3D = false;
            return;
        }
        const nsfwMode = this.auth.getUserSetting('nsfw-mode');
        const nsfwPlaceholder = (this.volume.nsfw == 1 && nsfwMode === 'settings.nsfw.hide-nsfw');
        const nsfw18Placeholder = (this.volume.nsfw18 == 1 && (nsfwMode === 'settings.nsfw.hide-nsfw' || nsfwMode === 'settings.nsfw.show-nsfw')) || (this.volume.nsfw18 == 1 && user.age_verified === false);
        console.log(nsfwMode, nsfwPlaceholder, nsfw18Placeholder)
        // show error message if volume covers have explicit content
        if(nsfwPlaceholder || nsfw18Placeholder){
            this.allowedToView3D = false;
            return;
        }
        this.allowedToView3D = true;
    }

    // reset 3d viewer
    public reset3D(){
        // dispose of renderer
        if(this.viewer?.renderer){
            this.viewer.renderer?.dispose();
            this.viewer.renderer?.forceContextLoss();
            this.viewer.renderer?.domElement?.remove();
            this.viewer.renderer = undefined;
        }
        this.threeDInitalized = false;
    }

    // open dialog
    public showDialog(){
        if(this.tabIndex === this.threeDIndex() && !this.allowedToView3D){
            this.show = false;
            this.tabIndex = 0;
            errorAlert(this.alerts, `Volume contains 16 or 18+ content, activate in settings to display.`, undefined, this.translate);
            return;
        }

        this.show = true;
        // restart render loop
        this.viewer.pauseRender = false;
        this.animate();
    }

    // close dialog
    public closeDialog(){
        this.show = false;
        // end render loop for better performance (doesnt need to run in the background)
        this.viewer.pauseRender = true;
    }

    threeDIndex(){
        return (3+this.volume.images?.length + 1);
    }

    // set tab index for gallery
    public setTabIndex(index:number){
        // if index is the 3d index, but the 3d view is not available then return
        if(index === this.threeDIndex() && !this.threeD) return;
        // else if the index is the 3d index (and its different from the already selected tab) 
        // then call the tab change event handler
        else if(index === this.threeDIndex() && this.tabIndex !== index) this.tabChanged(index);
        this.tabIndex = index;
    }

    // tab change event handler
    async tabChanged(e:any){
        if(!this.allowedToView3D) return;
        // if tab is 3d view and 3d view hasnt been initialized yet initialize it
        if(e === this.threeDIndex() && !this.threeDInitalized){
            await this.delay(500);
            const parts = this.volume.measures.split(' '); // 15.20 x 01.20 x 20.80 cm
            const maxHeight = 1.7;
            const measures:any = {};
            // TODO find a better way to realisticaly scale the 3d model (currently divided by 11)
            measures.originalWidth = parseFloat(parts[0]);
            measures.originalHeight = parseFloat(parts[4]);
            
            measures.width = parseFloat(parts[0]) / 11;
            measures.thickness = parseFloat(parts[2]) / 11;
            measures.height = parseFloat(parts[4]) / 11;
            
            // check if height is greater than max height and scale everything accordingly
            if(measures.height > maxHeight){
                const scalingFactor = maxHeight / measures.height;
                measures.height = maxHeight;
                measures.width *= scalingFactor;
                measures.thickness *= scalingFactor;
            }

            this.viewer.scene = new THREE.Scene();
            this.viewer.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
            this.viewer.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});
            this.viewer.renderer.setPixelRatio(2.0);
            this.viewer.renderer.setClearColor( 0x000000, 0.0 );
            this.viewer.renderer.setSize(window.innerWidth, window.innerHeight);
            this.viewer.renderer.domElement.classList.add('model-renderer');
            this.viewer.renderer.domElement.classList.add('loading');
            this.viewerLoading = true;
            this.viewer.renderer.useLegacyLights = true;
            this.viewerRef.nativeElement.appendChild(this.viewer.renderer.domElement);

            this.viewer.renderer.domElement.addEventListener('mousedown', (e:any) => { this.viewer.mouse[e.button] = true; });
            this.viewer.renderer.domElement.addEventListener('mouseup', (e:any) => { this.viewer.mouse[e.button] = false; });
            this.viewer.renderer.domElement.addEventListener('mousemove', this.model3DMovement.bind(this)); // rotation of the book
            this.viewer.renderer.domElement.addEventListener('touchmove', this.model3DMovement.bind(this), {passive: true});
            this.viewer.renderer.domElement.addEventListener('wheel', this.model3DZoom.bind(this), {passive: true}); // zoom of the book

            this.viewer.ambient = new THREE.AmbientLight(0x222222);
            this.viewer.scene.add(this.viewer.ambient);
            this.viewer.directLight = new THREE.DirectionalLight(0xffffff, 2);
            this.viewer.directLight.position.set(0,0,1.85);
            this.viewer.directLight.distance = 10;
            this.viewer.directLight.decay = 2;
            this.viewer.scene.add(this.viewer.directLight);

            this.viewer.loader = new THREE.TextureLoader();

            // spine, edge, edge, edge, front, back
            const urls = [
                `${CDN_BASE}/volumes/cover/${this.volume.id}/spine/high`, `/img/3d/edge.png`,
                `/img/3d/edge.png`,`/img/3d/edge.png`,
                `${CDN_BASE}/volumes/cover/${this.volume.id}/front/high`,
                `${CDN_BASE}/volumes/cover/${this.volume.id}/back/high`
            ];

            // switch spine and edge when volume is novel (they are not right to left)
            if(this.volume.seriesType === 'Novel'){
                urls[0] = `/img/3d/edge.png`;
                urls[1] = `${CDN_BASE}/volumes/cover/${this.volume.id}/spine/high`;
            }
                    
            this.viewer.materials = urls.map(url => {
                const tex = this.viewer.loader.load(url);
                tex.anisotropy = this.viewer.renderer.capabilities.getMaxAnisotropy();
                tex.colorSpace = THREE.SRGBColorSpace;
                const mat = new THREE.MeshPhongMaterial({ map: tex });
                mat.specular = new THREE.Color(0x000000);
                if(!mat.map) return mat;
                mat.map.minFilter = mat.map.magFilter = THREE.LinearFilter;
                return mat;
            });

            // mesh
            this.viewer.geometry = new THREE.BoxGeometry(measures.width, measures.height, measures.thickness);
            this.viewer.cube = new THREE.Mesh(this.viewer.geometry, this.viewer.materials);
            this.viewer.scene.add(this.viewer.cube);
            this.viewer.camera.position.z = 1.85;

            this.viewer.directLight.target = this.viewer.cube;
         
            // start rendering
            this.animate();

            this.threeDInitalized = true;

            setTimeout(()=>{
                this.viewer.renderer.domElement.classList.remove('loading');
                this.viewerLoading = false;
            }, 750);
        } else {
            await this.delay(500);
            this.viewerLoading = true;
            this.viewer.renderer.domElement.classList.add('loading');
            this.viewerRef.nativeElement.appendChild(this.viewer.renderer.domElement);
            setTimeout(()=>{
                this.viewer.renderer.domElement.classList.remove('loading');
                this.viewerLoading = false;
            }, 250);
        }
    }

    // 3d movement, mouse move event handler
    model3DMovement(e:any){
        // left mouse button rotates the book
        if(this.viewer.mouse[0]){
            //showDragIndicator.value = false;
            this.viewer.cube.rotation.y += e.movementX * 0.01;
    
            // TODO fix for novels (because spine and edge is switched for novels)
                    
            // clamp rotation at 0 - 180 degrees if volume has no spine cover set
            if(this.viewer.cube.rotation.y < 0 && !this.volume.spine_cover_path) this.viewer.cube.rotation.y = 0;
            if(this.viewer.cube.rotation.y > Math.PI && !this.volume.spine_cover_path) this.viewer.cube.rotation.y = Math.PI;
                    
            // clamp rotation at 90 or -90 degrees if volume has no back cover set
            if(this.viewer.cube.rotation.y > Math.PI / 2 && !this.volume.back_cover_path) this.viewer.cube.rotation.y = Math.PI / 2;
            else if(this.viewer.cube.rotation.y < -Math.PI / 2 && !this.volume.back_cover_path) this.viewer.cube.rotation.y = -Math.PI / 2;
        } 
    }
    
    // 3d zoom, mouse wheel event handler
    model3DZoom(e:any){
        // based on the scroll direction zoom in or out
        this.viewer.camera.position.z += 0.1 * (e.deltaY > 0 ? 1 : -1);
        // max zoom in/out = 0.2 / 3
        if(this.viewer.camera.position.z > 3) this.viewer.camera.position.z = 3;
        if(this.viewer.camera.position.z < 0.2) this.viewer.camera.position.z = 0.2;
    }

    // delay function
    delay(t:number){
        return new Promise((resolve)=>{
            setTimeout(()=>{
                resolve(true);
            },t);
        });
    }

    // render loop for 3d view
    animate(){
        if(!this.viewer?.renderer || this.viewer.pauseRender) return;
        requestAnimationFrame(this.animate.bind(this));
        this.viewer.renderer.render(this.viewer.scene, this.viewer.camera);
    }
}
