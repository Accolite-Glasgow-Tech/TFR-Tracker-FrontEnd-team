import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { GridsterComponent, IGridsterOptions } from 'angular2gridster';
import { ChartsComponent } from '../charts/charts.component';
import { WidgetApproachingProjectsComponent } from '../widget-approaching-projects/widget-approaching-projects.component';
import { MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';
import { WidgetClientLocationComponent } from '../widget-client-location/widget-client-location.component';
import { WidgetClientProjectCountComponent } from '../widget-client-project-count/widget-client-project-count.component';
import { ManageWidgetModalComponent } from '../manage-widget-modal/manage-widget-modal.component';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [MdbModalService],
})
export class HomeComponent implements OnInit {
  @ViewChild(GridsterComponent) gridster!: GridsterComponent;
  @ViewChild(WidgetClientLocationComponent)
  WidgetVendorLocationComponent!: WidgetClientLocationComponent;
  @ViewChild(WidgetClientProjectCountComponent)
  WidgetVendorProjectCountComponent!: WidgetClientProjectCountComponent;
  @ViewChild(ChartsComponent) ChartsComponent!: ChartsComponent;
  @ViewChild(WidgetApproachingProjectsComponent)
  WidgetApproachingProjectsComponent!: WidgetApproachingProjectsComponent;

  widgets: any[] = [];

  constructor(private matdialog: MatDialog) {}

  ngOnInit() {
    this.widgets.push({
      componentName: 'Client Location',
      present: true,
      componentType: WidgetClientLocationComponent,
    });
    this.widgets.push({
      componentName: 'Our Clients',
      present: true,
      componentType: WidgetClientProjectCountComponent,
    });
    this.widgets.push({
      componentName: 'TFR Status',
      present: true,
      componentType: ChartsComponent,
    });
    this.widgets.push({
      componentName: 'Upcoming Projects',
      present: true,
      componentType: WidgetApproachingProjectsComponent,
    });
  }

  widgetsfalse: any[] = [];

  gridsterOptions: IGridsterOptions = {
    lanes: this.getLaneCount(),
    floating: true,
    direction: 'vertical',
    dragAndDrop: false,
    resizable: false,
    useCSSTransforms: false,
    widthHeightRatio: 2,
    responsiveOptions: [
      {
        breakpoint: 'sm',
        minWidth: 0,
        lanes: 1,
      },
      {
        breakpoint: 'sm',
        minWidth: 320,
        lanes: 1,
      },
      {
        breakpoint: 'md',
        minWidth: 875,
        lanes: 2,
      },
      {
        breakpoint: 'lg',
        minWidth: 870,
        lanes: 2,
      },
      {
        breakpoint: 'xl',
        minWidth: 1800,
        lanes: 2,
      },
    ],
  };

  getLaneCount(): number {
    return 2;
  }

  public onClick_removeItem(_widget: any): void {
    this.widgets.splice(this.widgets.indexOf(_widget), 1);
    this.widgetsfalse.push({
      componentName: _widget.componentName,
      present: false,
      componentType: _widget.ChartsComponent,
    });
  }

  optionsChange(options: IGridsterOptions) {
    // console.log('options change:', options.lanes);
  }

  OpenPopup() {
    const popup = this.matdialog.open(ManageWidgetModalComponent, {
      panelClass: 'popup-window', // class defined in global styles.scss
      enterAnimationDuration: '500ms',
      data: { widgetdata: this.widgetsfalse },
    });

    popup.afterClosed().subscribe((item) => {
      if (item === 'TFR Status') {
        this.widgetsfalse.splice(
          this.widgetsfalse.findIndex((x) => x.componentName === 'TFR Status'),
          1
        );
        this.widgets.push({
          componentName: 'TFR Status',
          present: true,
          componentType: ChartsComponent,
        });
      }

      if (item === 'Upcoming Projects') {
        this.widgetsfalse.splice(
          this.widgetsfalse.findIndex(
            (x) => x.componentName === 'Upcoming Projects'
          ),
          1
        );
        this.widgets.push({
          componentName: 'Upcoming Projects',
          present: true,
          componentType: WidgetApproachingProjectsComponent,
        });
      }

      if (item === 'Our Clients') {
        this.widgetsfalse.splice(
          this.widgetsfalse.findIndex((x) => x.componentName === 'Our Clients'),
          1
        );
        this.widgets.push({
          componentName: 'Our Clients',
          present: true,
          componentType: WidgetClientProjectCountComponent,
        });
      }

      if (item === 'Client Location') {
        this.widgetsfalse.splice(
          this.widgetsfalse.findIndex(
            (x) => x.componentName === 'Client Location'
          ),
          1
        );
        this.widgets.push({
          componentName: 'Client Location',
          present: true,
          componentType: WidgetClientLocationComponent,
        });
      }
    });
  }
}
