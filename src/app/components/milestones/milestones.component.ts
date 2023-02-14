import { HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MilestoneManagerService } from 'src/app/services/milestone-manager/milestone-manager.service';
import { SnackBarService } from 'src/app/services/snack-bar/snack-bar.service';
import { TfrManagementService } from 'src/app/services/tfr-management/tfr-management.service';
import { MilestoneDTO, Project } from 'src/app/shared/interfaces';
@Component({
  selector: 'app-milestones',
  templateUrl: './milestones.component.html',
  styleUrls: ['./milestones.component.scss'],
  providers: [MilestoneManagerService],
})
export class MilestonesComponent implements OnInit {
  constructor(
    private milestoneManagerService: MilestoneManagerService,
    private projectManagerService: TfrManagementService,
    private snackBarService: SnackBarService
  ) {}
  @Output() nextStepEmitter = new EventEmitter<boolean>();
  @Output() stepCompletedEmitter = new EventEmitter<boolean>();
  isPristine: boolean = true;
  milestones: MilestoneDTO[] = [];
  formMilestone: MilestoneDTO | null = null;
  statusOptions: string[] = [];
  milestoneForm = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl<string>('', {
      nonNullable: true,
    }),
    acceptance_date: new FormControl<Date | null>(
      this.formMilestone?.acceptance_date ?? null,
      {
        validators: [Validators.required],
      }
    ),
    start_date: new FormControl<Date | null>(
      this.formMilestone?.start_date ?? null,
      {
        validators: [Validators.required],
      }
    ),
    delivery_date: new FormControl<Date | null>(
      this.formMilestone?.delivery_date ?? null,
      {
        validators: [Validators.required],
      }
    ),
    status: new FormControl<string>('INTENT', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  updateObserver = {
    next: () => this.update(),
  };
  get selectedMilestone(): MilestoneDTO | null {
    return this.formMilestone;
  }
  set selectedMilestone(milestone: MilestoneDTO | null) {
    this.formMilestone = milestone;
  }
  get submittable(): boolean {
    // this.stepCompletedEmitter.emit(
    //   this.milestoneManagerService.submittable && this.isPristine
    // );
    return this.milestoneManagerService.submittable && this.isPristine;
  }

  putObserver = {
    next: (response: {}) => {
      if (this.projectManagerService.project) {
        this.projectManagerService.project.version = Number(response);
      }
      this.snackBarService.showSnackBar('Updates saved to database', 2000);
      this.isPristine = true;
      this.resetMilestones();
      this.update();
    },
    error: (err: Error) =>
      this.snackBarService.showSnackBar(
        'Update failed, please try again',
        2000
      ),
  };

  getObserver = {
    next: (projectResponse: HttpResponse<Project>) => {
      this.projectManagerService.extractProject(projectResponse);
      this.snackBarService.showSnackBar('Get successful', 2000);
      this.milestoneManagerService.setMilestones(
        this.projectManagerService.getMilestones
      );
      this.update();
    },
    error: (err: Error) =>
      this.snackBarService.showSnackBar('Get failed, please retry', 2000),
  };

  update() {
    this.milestones = this.milestoneManagerService.getMilestones;
    let selectedMilestone = this.milestoneManagerService.getSelected;
    if (
      (selectedMilestone?.id && selectedMilestone?.possible_status) ||
      selectedMilestone == null
    ) {
      this.formMilestone = selectedMilestone;
    } else {
      console.log(selectedMilestone);
      throw new Error('selected milestone missing attributes');
    }
    if (this.formMilestone) {
      this.milestoneForm.setValue(this.ConvertMilestoneToFormData());
      this.formMilestone.possible_status!.length > 1
        ? this.milestoneForm.get('status')?.enable()
        : this.milestoneForm.get('status')?.disable();
    }
  }

  ngOnInit(): void {
    this.milestoneManagerService.Update.subscribe(this.updateObserver);
    this.milestoneManagerService.setMilestones(
      this.projectManagerService.getMilestones
    );
  }
  get getFormMilestone(): MilestoneDTO | null {
    if (this.formMilestone && this.formMilestone.possible_status) {
      return Object.assign(this.formMilestone, this.milestoneForm.value);
    } else throw new Error('milestone not assigned');
  }

  ConvertMilestoneToFormData(): {
    name: string;
    description: string;
    acceptance_date: Date | null;
    start_date: Date | null;
    delivery_date: Date | null;
    status: string;
  } {
    if (this.formMilestone != null) {
      let {
        name,
        description,
        acceptance_date,
        start_date,
        delivery_date,
        status,
      } = this.formMilestone;
      return {
        name,
        description,
        status,
        acceptance_date: acceptance_date ?? null,
        start_date: start_date ?? null,
        delivery_date: delivery_date ?? null,
      };
    }
    throw new Error('no milestone to turn into a form');
  }

  get getMinDate() {
    return this.projectManagerService.getBasicDetails?.start_date;
  }
  get getMaxDate() {
    return this.projectManagerService.getBasicDetails?.end_date;
  }
  selectNew() {
    this.milestoneManagerService.selectNewMilestone(
      this.projectManagerService.getProjectId
    );
    this.milestoneForm.markAsUntouched();
  }
  discardSelected() {
    this.milestoneManagerService.setSelected(null);
  }
  saveSelected() {
    this.milestoneManagerService.saveMilestone(this.getFormMilestone);
    this.isPristine = false;
  }

  get milestonesNotDeleted() {
    return this.milestoneManagerService.getMilestones.filter(
      (milestone) => !milestone.is_deleted
    );
  }
  removeMilestone(milestone: MilestoneDTO) {
    this.milestoneManagerService.updateToRemove(milestone);
    this.isPristine = false;
  }
  selectMilestone(milestone: MilestoneDTO) {
    this.milestoneManagerService.setSelected(milestone);
  }
  submitMilestones() {
    this.projectManagerService
      .putMilestones(this.milestoneManagerService.getMilestones)
      .subscribe(this.putObserver);
  }
  resetMilestones() {
    let projectId = this.projectManagerService.getProjectId;
    if (projectId) {
      this.projectManagerService
        .getFromDatabase(projectId)
        .subscribe(this.getObserver);
    } else {
      throw new Error('no project id found on project manager');
    }
  }
  nextStep() {
    this.stepCompletedEmitter.emit(true);
    this.nextStepEmitter.emit(true);
  }
  previousStep() {
    this.nextStepEmitter.emit(false);
  }
  get projectStatus(): string | undefined {
    return this.projectManagerService.project?.status;
  }
}
