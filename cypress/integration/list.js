import listPageFactory from '../support/ListPage';
import loginPageFactory from '../support/LoginPage';

describe('List Page', () => {
    const ListPagePosts = listPageFactory('/#/posts');
    const ListPageUsers = listPageFactory('/#/users');
    const LoginPage = loginPageFactory('/#/login');

    beforeEach(() => {
        ListPagePosts.navigate();
    });

    describe('Title', () => {
        it('should show the correct title in the appBar', () => {
            cy.get(ListPagePosts.elements.title).contains('Posts');
        });
    });

    describe('Auto-hide AppBar', () => {
        it('should hide/show the appBar when scroll action appears', () => {
            // wait for the skeleton to disappear
            cy.contains('1-10 of 13');

            cy.viewport(1280, 500);

            cy.scrollTo(0, 200);
            cy.get(ListPagePosts.elements.headroomUnpinned).should(
                'not.be.visible'
            );

            cy.scrollTo(0, -100);
            cy.get(ListPagePosts.elements.headroomUnfixed).should('be.visible');
        });
    });

    describe('Pagination', () => {
        it('should display paginated list of available posts', () => {
            cy.contains('1-10 of 13');
        });

        it('should switch page when clicking on previous/next page buttons or page numbers', () => {
            ListPagePosts.nextPage();
            cy.contains('11-13 of 13');

            ListPagePosts.previousPage();
            cy.contains('1-10 of 13');

            ListPagePosts.goToPage(2);
            cy.contains('11-13 of 13');
        });
    });

    describe('Filtering', () => {
        it('should display `alwaysOn` filters by default', () => {
            cy.get(ListPagePosts.elements.filter('q')).should(
                el => expect(el).to.exist
            );
        });

        it('should filter directly while typing (with some debounce)', () => {
            ListPagePosts.setFilterValue('q', 'quis culpa impedit');
            cy.get(ListPagePosts.elements.recordRows).should(el =>
                expect(el).to.have.length(1)
            );
            cy.contains('Omnis voluptate enim similique est possimus');
            cy.contains('1-1 of 1');
            ListPagePosts.setFilterValue('q', '', true);
            cy.contains('1-10 of 13');
        });

        it('should display new filter when clicking on "Add Filter"', () => {
            ListPagePosts.showFilter('title');

            cy.get(ListPagePosts.elements.filter('title')).should(
                el => expect(el).to.exist
            );

            cy.contains('1-1 of 1');

            ListPagePosts.hideFilter('title');
            cy.contains('1-10 of 13');
        });

        it('should hide filter when clicking on hide button', () => {
            ListPagePosts.showFilter('title');
            ListPagePosts.hideFilter('title');

            cy.get(ListPagePosts.elements.filter('title')).should(
                el => expect(el).to.not.exist
            );
            cy.contains('1-10 of 13');
        });

        it('should keep filters when navigating away and going back on given page', () => {
            LoginPage.navigate();
            LoginPage.login('admin', 'password');
            ListPagePosts.setFilterValue('q', 'quis culpa impedit');
            cy.contains('1-1 of 1');

            // This validates that defaultFilterValues on the user list is
            // not kept for posts after navigation.
            // See https://github.com/marmelab/react-admin/pull/2019
            cy.get('[href="#/users"]').click();
            cy.contains('1-2 of 2');

            cy.get('[href="#/posts"]').click();

            cy.get(ListPagePosts.elements.filter('q')).should(el =>
                expect(el).to.have.value('quis culpa impedit')
            );
            cy.contains('1-1 of 1');
            ListPagePosts.setFilterValue('q', '');
        });

        it('should allow to disable alwaysOn filters with default value', () => {
            LoginPage.navigate();
            LoginPage.login('admin', 'password');
            ListPageUsers.navigate();
            cy.contains('1-2 of 2');
            cy.get('button[title="Remove this filter"]').click();
            cy.contains('1-3 of 3');
        });
    });

    describe('Bulk Actions', () => {
        it('should allow to select all items on the current page', () => {
            cy.contains('1-10 of 13'); // wait for data
            ListPagePosts.toggleSelectAll();
            cy.get(ListPagePosts.elements.bulkActionsToolbar).should('exist');
            cy.contains('10 items selected');
            cy.get(ListPagePosts.elements.selectedItem).should(els =>
                expect(els).to.have.length(10)
            );
        });

        it('should allow to unselect all items on the current page', () => {
            cy.contains('1-10 of 13'); // wait for data
            ListPagePosts.toggleSelectAll();
            cy.get(ListPagePosts.elements.bulkActionsToolbar).should('exist');
            ListPagePosts.toggleSelectAll();
            cy.get(ListPagePosts.elements.bulkActionsToolbar).should(
                'not.exist'
            );
            cy.get(ListPagePosts.elements.selectedItem).should(els =>
                expect(els).to.have.length(0)
            );
        });

        it('should allow to trigger a custom bulk action on selected items', () => {
            cy.contains('1-10 of 13'); // wait for data
            ListPagePosts.toggleSelectAll();
            ListPagePosts.applyUpdateBulkAction();
            cy.get(ListPagePosts.elements.viewsColumn).should(els =>
                expect(els).to.have.text('0000000000')
            );
        });

        it('should have unselected all items after bulk action', () => {
            cy.contains('1-10 of 13'); // wait for data
            ListPagePosts.toggleSelectAll();
            ListPagePosts.applyUpdateBulkAction();
            cy.get(ListPagePosts.elements.bulkActionsToolbar).should(
                'not.exist'
            );
            cy.get(ListPagePosts.elements.selectedItem).should(els =>
                expect(els).to.have.length(0)
            );
        });

        it('should allow to select multiple items on the current page', () => {
            cy.contains('1-10 of 13'); // wait for data
            ListPagePosts.toggleSelectSomeItems(3);
            cy.get(ListPagePosts.elements.selectedItem).should(els =>
                expect(els).to.have.length(3)
            );
        });

        it('should allow to trigger the delete bulk action on selected items', () => {
            cy.contains('1-10 of 13'); // wait for data
            ListPagePosts.toggleSelectSomeItems(3);
            ListPagePosts.applyDeleteBulkAction();
            cy.contains('1-10 of 10');
        });
    });

    describe('rowClick', () => {
        it('should accept a function', () => {
            cy.contains(
                'Fusce massa lorem, pulvinar a posuere ut, accumsan ac nisi'
            )
                .parents('tr')
                .click();
            cy.contains('Summary').should(el => expect(el).to.exist);
        });

        it('should accept a function returning a promise', () => {
            LoginPage.navigate();
            LoginPage.login('user', 'password');
            ListPageUsers.navigate();
            cy.contains('Annamarie Mayer')
                .parents('tr')
                .click();
            cy.contains('Summary').should(el => expect(el).to.exist);
        });
    });

    describe('expand panel', () => {
        it('should show an expand button opening the expand element', () => {
            cy.contains('1-10 of 13'); // wait for data
            cy.get('[role="expand"]')
                .eq(0)
                .click();
            cy.get('[role="expand-content"]').should(el =>
                expect(el).to.contain(
                    'Curabitur eu odio ullamcorper, pretium sem at, blandit libero. Nulla sodales facilisis libero, eu gravida tellus ultrices nec. In ut gravida mi. Vivamus finibus tortor tempus egestas lacinia. Cras eu arcu nisl. Donec pretium dolor ipsum, eget feugiat urna iaculis ut.'
                )
            );
            cy.get('.datagrid-body').should(el =>
                expect(el).to.not.contain('[role="expand-content"]')
            );
        });

        it('should accept multiple expands', () => {
            cy.contains('1-10 of 13'); // wait for data
            cy.get('[role="expand"]')
                .eq(0)
                .click();
            cy.get('[role="expand"]')
                .eq(1)
                .click();
            cy.get('[role="expand-content"]').should(el =>
                expect(el).to.have.length(2)
            );
        });
    });

    describe('Sorting', () => {
        it('should display a sort arrow when clicking on a sortable column header', () => {
            ListPagePosts.toggleColumnSort('id');
            cy.get(ListPagePosts.elements.svg('id')).should('be.visible');

            ListPagePosts.toggleColumnSort('tags.name');
            cy.get(ListPagePosts.elements.svg('tags.name')).should(
                'be.visible'
            );
        });

        it('should hide the sort arrow when clicking on another sortable column header', () => {
            ListPagePosts.toggleColumnSort('published_at');
            cy.get(ListPagePosts.elements.svg('id')).should('be.hidden');
            cy.get(ListPagePosts.elements.svg('tags.name')).should('be.hidden');
        });

        it('should reverse the sort arrow when clicking on an already sorted column header', () => {
            ListPagePosts.toggleColumnSort('published_at');
            ListPagePosts.toggleColumnSort('tags.name');
            cy.get(
                ListPagePosts.elements.svg(
                    'tags.name',
                    '[class*=iconDirectionAsc]'
                )
            ).should('exist');

            ListPagePosts.toggleColumnSort('tags.name');
            cy.get(
                ListPagePosts.elements.svg(
                    'tags.name',
                    '[class*=iconDirectionDesc]'
                )
            ).should('exist');
        });
    });
});
