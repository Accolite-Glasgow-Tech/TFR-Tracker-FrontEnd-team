import { HttpResponse } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from 'src/app/services/api/api.service';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { ResponseHandlerService } from 'src/app/services/response-handler/response-handler.service';
import { TfrManagementService } from 'src/app/services/tfr-management/tfr-management.service';
import {
  AddResource,
  AllocatedResourceTypeDTO,
  DisplaySkillDTO,
  Project,
  ProjectResourceDTO,
  ResourceListType,
} from 'src/app/shared/interfaces';
import { UpdateResourceDialogComponent } from '../update-resource-dialog/update-resource-dialog.component';

export const RESOURCE_NAME = 'resource_name';
export const RESOURCE_ID = 'resource_id';

@Component({
  selector: 'app-tfr-creation-resource',
  templateUrl: './tfr-creation-resource.component.html',
  styleUrls: ['./tfr-creation-resource.component.scss'],
})
export class TfrCreationResourceComponent implements OnInit {
  constructor(
    protected resourceService: ResourceService,
    protected tfrManagementService: TfrManagementService,
    private responseHandlerService: ResponseHandlerService,
    private dialog: MatDialog,
    @Inject(ApiService) private apiService: ApiService
  ) {}

  resourceFormGroup!: FormGroup;
  resourcesCount: number = 1;
  resources!: ResourceListType[];
  currentResourceSkills: DisplaySkillDTO[] = [];
  currentResourceName!: string;
  seniorityLevels!: string[];
  allocatedResources: AllocatedResourceTypeDTO[] = [];
  resourceDetailsUpdated: boolean = false;
  previousUpdateSuccessful: boolean = true;
  tooltipMsg: string = '';
  @Output() nextStepEmitter = new EventEmitter<boolean>();
  @Output() stepCompletedEmitter = new EventEmitter<boolean>();
  @Input() editMode = false;

  getProjectObserver = {
    next: (projectResponse: HttpResponse<Project>) => {
      this.tfrManagementService.extractProject(projectResponse);
      this.apiService
        .getResourcesNamesByProjectIdFromDatabase(
          this.tfrManagementService.getProjectId as Number
        )
        .subscribe(this.getResourceNameObserver);
    },
    error: () => {
      this.stepCompletedEmitter.emit(false);
      this.responseHandlerService.badGet();
    },
  };

  getResourceNameObserver = {
    next: (data: AllocatedResourceTypeDTO[]) => {
      this.tfrManagementService.projectResourcesWithNames = data;
      this.allocatedResources = [
        ...this.tfrManagementService.getProjectResourcesWithNames,
      ];

      this.resources.map((resource) => (resource.selected = false));

      this.allocatedResources.forEach((allocatedResource) => {
        let indexOfResource = this.resources.findIndex(
          (val) =>
            val.resource_id === allocatedResource.resource_id &&
            !allocatedResource.is_deleted
        );
        if (indexOfResource !== -1) {
          this.resources[indexOfResource].selected = true;
        }
      });
      this.resourcesCount =
        this.tfrManagementService.getResourcesCount === 0
          ? 1
          : this.tfrManagementService.getResourcesCount!;

      this.resetFormGroup();
      this.resourceDetailsUpdated = false;
    },
    error: () => {
      this.stepCompletedEmitter.emit(false);
      this.responseHandlerService.badGet();
    },
  };

  getResourceSkillObserver = {
    next: (data: DisplaySkillDTO[]) => {
      this.currentResourceSkills = data;
    },
    error: () => {
      this.currentResourceSkills = [];
    },
  };

  ngOnInit(): void {
    this.resourceFormGroup = new FormGroup({
      resources_count: new FormControl('', {
        validators: [Validators.required],
      }),
    });

    this.apiService.getAllSeniorityLevels().subscribe((data: string[]) => {
      this.seniorityLevels = data;
    });

    this.apiService.getAllResources().subscribe((data: ResourceListType[]) => {
      this.resources = data;

      let temp: ProjectResourceDTO[] | undefined =
        this.tfrManagementService.getProjectResources;

      if (temp) {
        this.stepCompletedEmitter.emit(true);
        this.updateResourceList(temp);
        this.tfrManagementService.setProjectResourcesWithNames(
          this.allocatedResources
        );
      }

      if (this.tfrManagementService.getResourcesCount === 0) {
        this.resourceFormGroup.get('resources_count')?.setValue(1);
        this.resourcesCount = 1;
      } else {
        this.resourceFormGroup
          .get('resources_count')
          ?.setValue(this.tfrManagementService.getResourcesCount);
        this.resourcesCount = this.tfrManagementService.getResourcesCount!;
      }
      this.refreshTooltipMsg();
      this.addEventListener();
    });
  }

  valueChanges(allocationFormGroup: FormGroup) {
    if (this.resourceFormGroup.contains('allocation_form_group')) {
      this.resourceFormGroup.removeControl('allocation_form_group');
    }
    this.resourceFormGroup.addControl(
      'allocation_form_group',
      allocationFormGroup
    );
  }

  addResource(
    resource_name: string = this.resourceFormGroup.controls[
      'allocation_form_group'
    ].get('resource_name')?.value,
    role: string = this.resourceFormGroup.controls['allocation_form_group'].get(
      'role'
    )?.value,
    seniority: string = this.resourceFormGroup.controls[
      'allocation_form_group'
    ].get('seniorityLevel')?.value
  ) {
    this.resourceDetailsUpdated = true;

    const index = this.findResourceIndex(resource_name, RESOURCE_NAME);

    this.resources[index].selected = true;

    const allocatedResource: AllocatedResourceTypeDTO = {
      project_id: this.tfrManagementService.getProjectId as number,
      resource_id: this.resources[index].resource_id,
      resource_name: resource_name,
      resource_email: this.resources[index].resource_email,
      is_deleted: false,
      seniority: seniority,
      role: role,
    };

    const existingAllocatedResourceIndex = this.allocatedResources.findIndex(
      (resource) =>
        resource.resource_id === allocatedResource.resource_id &&
        resource.role === allocatedResource.role
    );

    if (existingAllocatedResourceIndex !== -1) {
      this.allocatedResources[existingAllocatedResourceIndex].seniority =
        seniority;
      this.allocatedResources[existingAllocatedResourceIndex].is_deleted =
        false;
    } else {
      this.allocatedResources.push(allocatedResource);
    }

    this.resetFormGroup();
  }

  removeResource(removedResource: AllocatedResourceTypeDTO) {
    this.resourceDetailsUpdated = true;

    const indexForResourcesArr = this.findResourceIndex(
      removedResource.resource_id,
      RESOURCE_ID
    );
    this.resources[indexForResourcesArr].selected = false;
    const indexForAllocatedResourceArr = this.allocatedResources.findIndex(
      (resource) =>
        resource.resource_id === removedResource.resource_id &&
        resource.role === removedResource.role
    );
    this.allocatedResources[indexForAllocatedResourceArr].is_deleted = true;

    this.resetFormGroup();
  }

  resetFormGroup() {
    this.resourceFormGroup.controls['allocation_form_group'].patchValue({
      resource_name: '',
      role: '',
      seniorityLevel: '',
    });

    this.resourceFormGroup.controls['allocation_form_group'].markAsPristine();
    this.resourceFormGroup.controls['allocation_form_group'].markAsUntouched();

    this.currentResourceSkills = [];

    this.resourceFormGroup
      .get('resources_count')
      ?.setValue(this.resourcesCount, { emitEvent: false });
    this.refreshTooltipMsg();
    this.addEventListener();
  }

  updateResourceList(projectResources: ProjectResourceDTO[]) {
    projectResources.forEach((resource: ProjectResourceDTO) => {
      let indexOfResource = this.findResourceIndex(
        resource.resource_id,
        RESOURCE_ID
      );

      if (!resource.is_deleted) {
        this.resources[indexOfResource].selected = true;
      }

      const allocatedResource: AllocatedResourceTypeDTO = {
        project_id: resource.project_id,
        resource_id: resource.resource_id,
        resource_name: this.resources[indexOfResource].resource_name,
        resource_email: this.resources[indexOfResource].resource_email,
        is_deleted: resource.is_deleted,
        seniority: resource.seniority,
        role: resource.role,
      };

      this.allocatedResources.push(allocatedResource);
    });
  }

  triggerStep(forward: boolean) {
    if (this.resourceDetailsUpdated) {
      this.responseHandlerService.unsavedChangesDialogue();
    } else {
      this.nextStep(forward);
    }
  }

  nextStep(forward: boolean) {
    this.stepCompletedEmitter.emit(forward);
    this.nextStepEmitter.emit(forward);
  }

  resetResources() {
    this.tfrManagementService
      .getFromDatabase(this.tfrManagementService.getProjectId as number)
      .subscribe(this.getProjectObserver);
  }

  saveToDatabase() {
    this.tfrManagementService.setProjectResourcesWithNames(
      this.allocatedResources
    );
    this.tfrManagementService.setResourcesCount(this.resourcesCount);
    this.tfrManagementService
      .updateProjectToResourceMapping()
      .subscribe((updateSuccessful) => {
        this.resourceDetailsUpdated = !updateSuccessful;
        this.previousUpdateSuccessful = updateSuccessful;
        if (!updateSuccessful) this.stepCompletedEmitter.emit(false);
      });
  }

  addEventListener() {
    this.resourceFormGroup
      .get('resources_count')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((val: number) => {
        this.resourcesCount = val;
        this.resourceDetailsUpdated = true;
        this.refreshTooltipMsg();
      });
  }

  getSkills(selectedResource: ResourceListType) {
    this.currentResourceName = selectedResource.resource_name;
    this.apiService
      .getSkillsByResourceId(selectedResource.resource_id)
      .subscribe(this.getResourceSkillObserver);
  }

  refreshTooltipMsg() {
    let allocatedResourceCount = this.resourceService.resourcesWithoutDeleted(
      this.allocatedResources
    ).length;
    this.tooltipMsg =
      this.resourcesCount > allocatedResourceCount
        ? `${this.resourcesCount - allocatedResourceCount} more to allocate`
        : `${allocatedResourceCount - this.resourcesCount} allocated in excess`;
  }

  editResource(resourceToEdit: AllocatedResourceTypeDTO) {
    let indexOfResource: number = this.findResourceIndex(
      resourceToEdit.resource_id,
      RESOURCE_ID
    );

    this.resources[indexOfResource].selected = false;
    let dialogRef!: MatDialogRef<UpdateResourceDialogComponent, any>;
    dialogRef = this.dialog.open(UpdateResourceDialogComponent, {
      data: {
        resources: this.resources,
        seniorityLevels: this.seniorityLevels,
        resourceToEdit: resourceToEdit,
      },
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result: AddResource) => {
      if (result) {
        if (
          result.resource_name !== this.resources[indexOfResource].resource_name
        ) {
          indexOfResource = this.allocatedResources.findIndex(
            (r) =>
              r.resource_name ===
                this.resources[indexOfResource].resource_name &&
              r.is_deleted === false
          );
          this.allocatedResources[indexOfResource].is_deleted = true;
          indexOfResource = this.findResourceIndex(
            result.resource_name,
            RESOURCE_NAME
          );
          this.resources[indexOfResource].selected = true;
          this.addResource(result.resource_name, result.role, result.seniority);
        } else {
          this.resources[indexOfResource].selected = true;
          indexOfResource = this.allocatedResources.findIndex(
            (r) =>
              r.resource_name ===
                this.resources[indexOfResource].resource_name &&
              r.is_deleted === false
          );
          this.allocatedResources[indexOfResource].role = result.role;
          this.allocatedResources[indexOfResource].seniority = result.seniority;
        }
        this.resourceDetailsUpdated = true;
      } else {
        this.resources[indexOfResource].selected = true;
      }
    });
  }

  findResourceIndex(searchValue: any, keyString: string): number {
    let key = keyString as keyof ResourceListType;
    return this.resources.findIndex((r) => r[key] === searchValue);
  }
}
