import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from 'src/app/services/api/api.service';
import { TfrManagementService } from 'src/app/services/tfr-management/tfr-management.service';

import {
  ProjectBasicDetails,
  ClientAttributeDTO,
  ClientDTO,
} from 'src/app/shared/interfaces';
import { TfrCreationDialogComponent } from '../tfr-creation-dialog/tfr-creation-dialog.component';

@Component({
  selector: 'app-tfr-basic-details',
  templateUrl: './tfr-basic-details.component.html',
  styleUrls: ['./tfr-basic-details.component.scss'],
})
export class TfrBasicDetailsComponent implements OnInit {
  constructor(
    protected tfrManager: TfrManagementService,
    private matDialog: MatDialog,
    private apiService: ApiService
  ) {}

  @Output() nextStepEmitter = new EventEmitter<boolean>();
  @Output() stepCompletedEmitter = new EventEmitter<boolean>();

  tfrDetails!: FormGroup;
  projectDetails!: ProjectBasicDetails;
  selectedProject!: ProjectBasicDetails;
  clientGroup!: FormGroup;
  attributeNames: string[] = [];
  client_specificData: { [key: string]: string } = {};
  editMode: Boolean = false;
  projectToEdit!: ProjectBasicDetails;
  @Output() editModeEmitter = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.tfrDetails = new FormGroup({
      name: new FormControl('', [Validators.required]),
      start_date: new FormControl<Date | null>(null),
      end_date: new FormControl<Date | null>(null),
      client_id: new FormControl('', [Validators.required]),
    });

    // check whether project exists yet, and if so, pre-fill details and set to edit mode
    if (this.tfrManager.getBasicDetails != undefined) {
      this.editMode = true;
      this.stepCompletedEmitter.emit(true);
      this.editModeEmitter.emit(true);
      // edit mode
      this.projectToEdit = this.tfrManager.getBasicDetails;
      // set form group details to existing details
      this.setDetailsToExistingProject();
    }
  }

  isFormValid() {
    if (this.clientGroup == undefined) {
      return false;
    } else {
      return this.clientGroup.valid && this.tfrDetails.valid;
    }
  }

  isFormDirty() {
    if (this.isFormValid()) {
      return this.clientGroup.dirty || this.tfrDetails.dirty;
    }
    return false;
  }

  setDetailsToExistingProject() {
    this.tfrDetails.get('name')?.setValue(this.projectToEdit.name);
    this.tfrDetails.get('start_date')?.setValue(this.projectToEdit.start_date);
    this.tfrDetails.get('end_date')?.setValue(this.projectToEdit.end_date);
  }

  saveTFR() {
    // take data from tfrDetails and combine with residual info from selected project id
    let updatedProjectDetails: ProjectBasicDetails = {
      name: this.tfrDetails.get('name')?.value,
      start_date: this.tfrDetails.get('start_date')?.value,
      end_date: this.tfrDetails.get('end_date')?.value,
      client_id: this.tfrDetails.get('client_id')?.value,
      client_specific: this.client_specificData,
      status: this.editMode ? this.projectToEdit.status : 'DRAFT',
    };
    this.tfrManager.setBasicDetails(updatedProjectDetails);
    this.tfrDetails.markAsPristine();
    this.clientGroup.markAsPristine();
  }

  onClientSelect(client: ClientDTO) {
    this.tfrDetails.get('client_id')?.setValue(client.id);
    this.tfrDetails.get('client_id')?.markAsDirty;
  }

  /*
    Move onto the next step of the stepper
  */
  next() {
    if (this.isFormDirty()) {
      let dialogRef = this.matDialog.open(TfrCreationDialogComponent, {
        data: {
          title: 'Discard Changes',
          content: 'Would you like to discard your changes and continue?',
          confirmText: 'Yes',
          cancelText: 'No',
        },
      });
      dialogRef.afterClosed().subscribe((result: string) => {
        if (result === 'true') {
          /* User wants to discard changes */
          this.stepCompletedEmitter.emit(true);
          this.nextStepEmitter.emit(true);
          /* Resets the value of the input fields to the most recent state of the database */
          this.resetInputFields();
        }
      });
    } else {
      this.stepCompletedEmitter.emit(true);
      this.nextStepEmitter.emit(true);
    }
  }

  /*
    Resets the input fields to the most recent state of the database
  */
  resetInputFields() {
    let previousStateBasicDetails: ProjectBasicDetails =
      this.tfrManager.getBasicDetails!;

    this.tfrDetails.get('name')?.setValue(previousStateBasicDetails.name);
    this.tfrDetails
      .get('start_date')
      ?.setValue(previousStateBasicDetails.start_date);
    this.tfrDetails
      .get('end_date')
      ?.setValue(previousStateBasicDetails.end_date);
    this.tfrDetails
      .get('client_id')
      ?.setValue(previousStateBasicDetails.client_id);

    !this.projectToEdit ??
      (this.projectToEdit.client_id = previousStateBasicDetails.client_id);

    /*
      Trigger event to Client component through the api.service
    */
    this.apiService.resetClientDetails();

    this.tfrDetails.markAsPristine();
    this.clientGroup.markAsPristine();
  }

  onAttributesSelected(attributes: ClientAttributeDTO[]) {
    this.attributeNames = [];
    attributes.forEach((att) => {
      this.attributeNames.push(att.attribute_name);
    });
  }

  onAttributesUpdated(group: FormGroup) {
    this.clientGroup = group;
    this.updateClient_specific();
  }

  updateClient_specific() {
    this.client_specificData = {};
    // convert the form group info to string data and assign to client_specificData string
    if (this.clientGroup.valid) {
      let i = 0;
      while (i < this.attributeNames.length) {
        this.client_specificData[this.attributeNames[i]] =
          this.getAttributesArray().controls[i].value;
        i++;
      }
    }
  }

  getAttributesArray() {
    return this.clientGroup.controls['attributeValues'] as FormArray;
  }
}
