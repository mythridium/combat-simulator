/*  Melvor Idle Combat Simulator

    Copyright (C) <2020>  <Coolrox95>
    Modified Copyright (C) <2020> <Visua0>
    Modified Copyright (C) <2020, 2021> <G. Miclotte>
    Modified Copyright (C) <2022, 2023> <Broderick Hyman>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

class Menu {
    static addModal(title: string, id: string) {
        // create modal
        const modal = document.createElement("div");
        modal.id = id;
        modal.className = "modal";

        // create dialog
        const modalDialog = document.createElement("div");
        modalDialog.className = "modal-dialog";
        modal.appendChild(modalDialog);

        // create content wrapper
        const modalContent = document.createElement("div");
        modalContent.className = "modal-content";
        modalDialog.appendChild(modalContent);

        // create header
        const modalHeader =
            $(`<div class="block block-themed block-transparent mb-0"><div class="block-header bg-primary-dark">
        <h3 class="block-title">${title}</h3>
        <div class="block-options"><button type="button" class="btn-block-option" data-dismiss="modal" aria-label="Close">
        <i class="fa fa-fw fa-times"></i></button></div></div></div>`);
        $(modalContent).append(modalHeader);

        // insert modal
        document.getElementById("page-container")!.appendChild(modal);

        // return modal
        return modal;
    }
}
