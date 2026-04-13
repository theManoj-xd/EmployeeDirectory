import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../services/employee-service';
import { Employee } from '../models/employee.model';

@Component({
  selector: 'app-employee-list',
  imports: [CommonModule, DecimalPipe, DatePipe],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeList implements OnInit {
  private employeeService: EmployeeService = inject(EmployeeService);
  private searchSubject: Subject<string> = new Subject<string>();

  employees = signal<Employee[]>([]);
  isLoading = signal<boolean>(true);
  totalCount = signal<number>(0);

  //Dropdown Options
  departments: string[] = [];
  locations: string[] = [];
  statuses: string[] = [];


  ngOnInit(): void {
    //Setup search subscription
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged())
      .subscribe((term) => {
        this.employeeService.setSearchTerm(term);
        this.refreshEmployees();
      });
    this.isLoading.set(true);
    this.employeeService.getEmployees()
      .subscribe({
        next: (data: Employee[]) => {
          this.employeeService.setEmployees(data);

          //Populate dropdowns options
          this.departments = this.employeeService.getDepartments();
          this.locations = this.employeeService.getLocations();
          this.statuses = this.employeeService.getStatuses();

          this.refreshEmployees();
          this.totalCount.set(data.length);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error fetching employees:', error);
          this.isLoading.set(false);
        }
      })
  }

  private refreshEmployees(): void {
    this.employees.set(this.employeeService.getFilteredAndSortedEmployees());
  }

  //Pagination getters
  get currentPage(): number {
    return this.employeeService.getCurrentPage();
  }

  get totalPages(): number {
    return this.employeeService.getTotalPages();
  }

  get pageSize(): number {
    return this.employeeService.getPageSize();
  }

  get filteredCount(): number {
    return this.employeeService.getFilteredCount();
  }

  //Pagination Methods
  onpageChange(page: number): void {
    this.employeeService.setPage(page);
    this.refreshEmployees();
  }

  onNextPage(): void {
    this.employeeService.nextPage();
    this.refreshEmployees();
  }

  onPreviousPage(): void {
    this.employeeService.previousPage();
    this.refreshEmployees();
  }

  get rangeStart():number {
    if(this.filteredCount === 0) 
      return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd():number {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredCount ? this.filteredCount : end;
  }

  get sortColumn(): string {
    return this.employeeService.getSortColumn();
  }

  get sortDirection(): 'asc' | 'desc' {
    return this.employeeService.getSortDirection();
  }

  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  onSort(column: string): void {
    this.employeeService.setSort(column);
    this.refreshEmployees();
  }

  //Dropdown Handlers
  onDepartmentFilter(department: string): void {
    this.employeeService.setDepartmentFilter(department);
    this.refreshEmployees();
  }
  onLocationFilter(location: string): void {
    this.employeeService.setLocationFilter(location);
    this.refreshEmployees();
  }
  onStatusFilter(status: string): void {
    this.employeeService.setStatusFilter(status);
    this.refreshEmployees();
  }

  //Pagination
  get pageNumber(): number[]{
    return [...Array(this.totalPages).keys()].map(i => i + 1);
  } 
}
